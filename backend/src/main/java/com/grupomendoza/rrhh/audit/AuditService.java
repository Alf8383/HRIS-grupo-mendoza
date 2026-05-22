package com.grupomendoza.rrhh.audit;

import com.grupomendoza.rrhh.audit.dto.AuditLogResponse;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {
    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            AuthenticatedUser currentUser,
            String module,
            String action,
            String entityType,
            Long entityId,
            String summary
    ) {
        try {
            AuditLog auditLog = new AuditLog();
            auditLog.setUserId(currentUser != null ? currentUser.getId() : null);
            auditLog.setUserEmail(currentUser != null ? currentUser.getUsername() : "system");
            auditLog.setModule(module);
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            auditLog.setSummary(summary);
            auditLogRepository.save(auditLog);
        } catch (Exception exception) {
            logger.warn("Audit log could not be persisted for module={} action={}", module, action, exception);
        }
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> list(
            String userSearch,
            String module,
            String action,
            LocalDate startDate,
            LocalDate endDate
    ) {
        Instant startAt = startDate != null
                ? startDate.atStartOfDay(ZoneId.systemDefault()).toInstant()
                : null;
        Instant endAt = endDate != null
                ? endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant().minusMillis(1)
                : null;

        String normalizedUserSearch = normalizeNullable(userSearch);
        String normalizedModule = normalizeNullable(module);
        String normalizedAction = normalizeNullable(action);

        return auditLogRepository.findAllByOrderByEventAtDescIdDesc().stream()
                .filter(log -> normalizedUserSearch == null
                        || log.getUserEmail() != null && log.getUserEmail().toLowerCase().contains(normalizedUserSearch))
                .filter(log -> normalizedModule == null || normalizedModule.equalsIgnoreCase(log.getModule()))
                .filter(log -> normalizedAction == null || normalizedAction.equalsIgnoreCase(log.getAction()))
                .filter(log -> startAt == null || !log.getEventAt().isBefore(startAt))
                .filter(log -> endAt == null || !log.getEventAt().isAfter(endAt))
                .map(log -> new AuditLogResponse(
                        log.getId(),
                        log.getEventAt(),
                        log.getUserId(),
                        log.getUserEmail(),
                        log.getModule(),
                        log.getAction(),
                        log.getEntityType(),
                        log.getEntityId(),
                        log.getSummary()
                ))
                .toList();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toLowerCase();
    }
}
