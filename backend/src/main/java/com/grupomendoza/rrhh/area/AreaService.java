package com.grupomendoza.rrhh.area;

import com.grupomendoza.rrhh.area.dto.AreaRequest;
import com.grupomendoza.rrhh.area.dto.AreaResponse;
import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.common.status.RecordStatus;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AreaService {
    private final AreaRepository areaRepository;

    public AreaService(AreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    @Transactional(readOnly = true)
    public List<AreaResponse> list(String search, String status) {
        RecordStatus parsedStatus = SearchQuery.parseEnum(status, RecordStatus.class);
        return areaRepository.search(SearchQuery.normalize(search), parsedStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AreaResponse get(Long id) {
        return toResponse(findArea(id));
    }

    @Transactional
    public AreaResponse create(AreaRequest request) {
        validateUniqueName(request.name(), null);

        Area area = new Area();
        area.setName(request.name().trim());
        area.setDescription(normalizeNullable(request.description()));
        area.setStatus(RecordStatus.ACTIVE);

        return toResponse(areaRepository.save(area));
    }

    @Transactional
    public AreaResponse update(Long id, AreaRequest request) {
        Area area = findArea(id);
        validateUniqueName(request.name(), id);

        area.setName(request.name().trim());
        area.setDescription(normalizeNullable(request.description()));

        return toResponse(areaRepository.save(area));
    }

    @Transactional
    public AreaResponse updateStatus(Long id, String status) {
        Area area = findArea(id);
        area.setStatus(SearchQuery.parseEnum(status, RecordStatus.class));

        return toResponse(areaRepository.save(area));
    }

    public Area findActiveArea(Long id) {
        Area area = findArea(id);
        if (area.getStatus() != RecordStatus.ACTIVE) {
            throw new IllegalStateException("The selected area is inactive.");
        }
        return area;
    }

    private Area findArea(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Area not found."));
    }

    private void validateUniqueName(String name, Long currentId) {
        String normalizedName = name.trim();
        areaRepository.findByNameIgnoreCase(normalizedName)
                .filter(area -> currentId == null || !area.getId().equals(currentId))
                .ifPresent(area -> {
                    throw new IllegalStateException("An area with this name already exists.");
                });
    }

    private AreaResponse toResponse(Area area) {
        return new AreaResponse(
                area.getId(),
                area.getName(),
                area.getDescription(),
                area.getStatus().name()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
