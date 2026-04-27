package com.grupomendoza.rrhh.position;

import com.grupomendoza.rrhh.area.Area;
import com.grupomendoza.rrhh.area.AreaService;
import com.grupomendoza.rrhh.area.dto.AreaResponse;
import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.common.status.RecordStatus;
import com.grupomendoza.rrhh.position.dto.PositionRequest;
import com.grupomendoza.rrhh.position.dto.PositionResponse;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PositionService {
    private final PositionRepository positionRepository;
    private final AreaService areaService;

    public PositionService(PositionRepository positionRepository, AreaService areaService) {
        this.positionRepository = positionRepository;
        this.areaService = areaService;
    }

    @Transactional(readOnly = true)
    public List<PositionResponse> list(String search, String status, Long areaId) {
        RecordStatus parsedStatus = SearchQuery.parseEnum(status, RecordStatus.class);
        return positionRepository.search(SearchQuery.normalize(search), parsedStatus, areaId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PositionResponse get(Long id) {
        return toResponse(findPosition(id));
    }

    @Transactional
    public PositionResponse create(PositionRequest request) {
        Area area = areaService.findActiveArea(request.areaId());
        validateUniqueName(area.getId(), request.name(), null);

        Position position = new Position();
        position.setArea(area);
        position.setName(request.name().trim());
        position.setDescription(normalizeNullable(request.description()));
        position.setStatus(RecordStatus.ACTIVE);

        return toResponse(positionRepository.save(position));
    }

    @Transactional
    public PositionResponse update(Long id, PositionRequest request) {
        Position position = findPosition(id);
        Area area = areaService.findActiveArea(request.areaId());
        validateUniqueName(area.getId(), request.name(), id);

        position.setArea(area);
        position.setName(request.name().trim());
        position.setDescription(normalizeNullable(request.description()));

        return toResponse(positionRepository.save(position));
    }

    @Transactional
    public PositionResponse updateStatus(Long id, String status) {
        Position position = findPosition(id);
        position.setStatus(SearchQuery.parseEnum(status, RecordStatus.class));
        return toResponse(positionRepository.save(position));
    }

    public Position findActivePosition(Long id) {
        Position position = findPosition(id);
        if (position.getStatus() != RecordStatus.ACTIVE) {
            throw new IllegalStateException("The selected position is inactive.");
        }
        if (position.getArea().getStatus() != RecordStatus.ACTIVE) {
            throw new IllegalStateException("The selected area is inactive.");
        }
        return position;
    }

    private Position findPosition(Long id) {
        return positionRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Position not found."));
    }

    private void validateUniqueName(Long areaId, String name, Long currentId) {
        String normalizedName = name.trim();
        positionRepository.search(normalizedName.toLowerCase(), null, areaId).stream()
                .filter(position -> position.getName().equalsIgnoreCase(normalizedName))
                .filter(position -> currentId == null || !position.getId().equals(currentId))
                .findFirst()
                .ifPresent(position -> {
                    throw new IllegalStateException("A position with this name already exists in the selected area.");
                });
    }

    private PositionResponse toResponse(Position position) {
        return new PositionResponse(
                position.getId(),
                position.getName(),
                position.getDescription(),
                position.getStatus().name(),
                new AreaResponse(
                        position.getArea().getId(),
                        position.getArea().getName(),
                        position.getArea().getDescription(),
                        position.getArea().getStatus().name()
                )
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
