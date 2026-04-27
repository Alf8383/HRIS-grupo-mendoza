package com.grupomendoza.rrhh.site;

import com.grupomendoza.rrhh.common.api.SearchQuery;
import com.grupomendoza.rrhh.common.status.RecordStatus;
import com.grupomendoza.rrhh.site.dto.SiteRequest;
import com.grupomendoza.rrhh.site.dto.SiteResponse;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteService {
    private final SiteRepository siteRepository;

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    @Transactional(readOnly = true)
    public List<SiteResponse> list(String search, String status) {
        RecordStatus parsedStatus = SearchQuery.parseEnum(status, RecordStatus.class);
        return siteRepository.search(SearchQuery.normalize(search), parsedStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SiteResponse get(Long id) {
        return toResponse(findSite(id));
    }

    @Transactional
    public SiteResponse create(SiteRequest request) {
        validateUniqueName(request.name(), null);

        Site site = new Site();
        site.setName(request.name().trim());
        site.setDescription(normalizeNullable(request.description()));
        site.setStatus(RecordStatus.ACTIVE);

        return toResponse(siteRepository.save(site));
    }

    @Transactional
    public SiteResponse update(Long id, SiteRequest request) {
        Site site = findSite(id);
        validateUniqueName(request.name(), id);

        site.setName(request.name().trim());
        site.setDescription(normalizeNullable(request.description()));

        return toResponse(siteRepository.save(site));
    }

    @Transactional
    public SiteResponse updateStatus(Long id, String status) {
        Site site = findSite(id);
        site.setStatus(SearchQuery.parseEnum(status, RecordStatus.class));

        return toResponse(siteRepository.save(site));
    }

    public Site findActiveSite(Long id) {
        Site site = findSite(id);
        if (site.getStatus() != RecordStatus.ACTIVE) {
            throw new IllegalStateException("The selected site is inactive.");
        }
        return site;
    }

    private Site findSite(Long id) {
        return siteRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Site not found."));
    }

    private void validateUniqueName(String name, Long currentId) {
        String normalizedName = name.trim();
        siteRepository.findByNameIgnoreCase(normalizedName)
                .filter(site -> currentId == null || !site.getId().equals(currentId))
                .ifPresent(site -> {
                    throw new IllegalStateException("A site with this name already exists.");
                });
    }

    private SiteResponse toResponse(Site site) {
        return new SiteResponse(
                site.getId(),
                site.getName(),
                site.getDescription(),
                site.getStatus().name()
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
