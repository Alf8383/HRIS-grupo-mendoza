package com.grupomendoza.rrhh.contract.dto;

import java.time.Instant;

public record ContractDocumentResponse(
        Long id,
        Long contractId,
        String fileName,
        String contentType,
        Long fileSize,
        Instant uploadedAt
) {
}
