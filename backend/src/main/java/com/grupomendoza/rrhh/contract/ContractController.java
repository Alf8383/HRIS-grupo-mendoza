package com.grupomendoza.rrhh.contract;

import com.grupomendoza.rrhh.audit.AuditService;
import com.grupomendoza.rrhh.common.api.ApiResponse;
import com.grupomendoza.rrhh.contract.dto.ContractDocumentResponse;
import com.grupomendoza.rrhh.contract.dto.ContractResponse;
import com.grupomendoza.rrhh.contract.dto.CreateContractRequest;
import com.grupomendoza.rrhh.contract.dto.ExpiringContractResponse;
import com.grupomendoza.rrhh.contract.dto.RenewContractRequest;
import com.grupomendoza.rrhh.contract.dto.UpdateContractRequest;
import com.grupomendoza.rrhh.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {
    private final ContractService contractService;
    private final AuditService auditService;

    public ContractController(ContractService contractService, AuditService auditService) {
        this.contractService = contractService;
        this.auditService = auditService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<ContractResponse>> create(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateContractRequest request
    ) {
        ContractResponse response = contractService.create(request);
        auditService.record(currentUser, "CONTRACT", "CREATE", "CONTRACT", response.id(), "Contrato creado para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<ContractResponse>>> listByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(ApiResponse.success(contractService.listByEmployee(employeeId)));
    }

    @GetMapping("/expiring")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<ExpiringContractResponse>>> listExpiring() {
        return ResponseEntity.ok(ApiResponse.success(contractService.listExpiring()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<ContractResponse>> update(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateContractRequest request
    ) {
        ContractResponse response = contractService.update(id, request);
        auditService.record(currentUser, "CONTRACT", "UPDATE", "CONTRACT", response.id(), "Contrato actualizado para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/renew")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<ContractResponse>> renew(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @Valid @RequestBody RenewContractRequest request
    ) {
        ContractResponse response = contractService.renew(id, request);
        auditService.record(currentUser, "CONTRACT", "RENEW", "CONTRACT", response.id(), "Contrato renovado para " + response.employeeName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<ContractDocumentResponse>> uploadDocument(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        ContractDocumentResponse response = contractService.uploadDocument(id, file);
        auditService.record(currentUser, "CONTRACT", "UPLOAD_DOCUMENT", "CONTRACT", id, "Documento cargado: " + response.fileName());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<ApiResponse<List<ContractDocumentResponse>>> listDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(contractService.listDocuments(id)));
    }

    @GetMapping("/{id}/documents/{documentId}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long id,
            @PathVariable Long documentId
    ) {
        ContractDocument document = contractService.downloadDocument(id, documentId);
        String fileName = URLEncoder.encode(document.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + fileName)
                .body(document.getFileData());
    }
}
