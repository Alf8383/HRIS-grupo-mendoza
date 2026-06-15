package com.grupomendoza.rrhh.contract;

import com.grupomendoza.rrhh.contract.dto.ContractResponse;
import com.grupomendoza.rrhh.contract.dto.ContractDocumentResponse;
import com.grupomendoza.rrhh.contract.dto.CreateContractRequest;
import com.grupomendoza.rrhh.contract.dto.ExpiringContractResponse;
import com.grupomendoza.rrhh.contract.dto.RenewContractRequest;
import com.grupomendoza.rrhh.contract.dto.UpdateContractRequest;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ContractService {
    private static final int EXPIRING_THRESHOLD_DAYS = 30;
    private static final long MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

    private final ContractRepository contractRepository;
    private final ContractDocumentRepository contractDocumentRepository;
    private final EmployeeRepository employeeRepository;

    public ContractService(
            ContractRepository contractRepository,
            ContractDocumentRepository contractDocumentRepository,
            EmployeeRepository employeeRepository
    ) {
        this.contractRepository = contractRepository;
        this.contractDocumentRepository = contractDocumentRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public ContractResponse create(CreateContractRequest request) {
        Employee employee = findEmployee(request.employeeId());
        Contract contract = new Contract();
        contract.setEmployee(employee);
        applyContractData(
                contract,
                request.contractType(),
                request.startDate(),
                request.endDate(),
                request.status(),
                request.notes()
        );
        return toResponse(contractRepository.save(contract));
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> listByEmployee(Long employeeId) {
        findEmployee(employeeId);
        return contractRepository.findByEmployeeIdDetailed(employeeId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExpiringContractResponse> listExpiring() {
        LocalDate today = LocalDate.now();
        LocalDate threshold = today.plusDays(EXPIRING_THRESHOLD_DAYS);
        return contractRepository.findExpiringBetween(today, threshold).stream()
                .map(contract -> new ExpiringContractResponse(
                        contract.getId(),
                        contract.getEmployee().getId(),
                        contract.getEmployee().getUser().getFullName(),
                        contract.getEmployee().getPosition().getArea().getName(),
                        contract.getEmployee().getPosition().getName(),
                        contract.getContractType().name(),
                        contract.getEndDate(),
                        ChronoUnit.DAYS.between(today, contract.getEndDate())
                ))
                .toList();
    }

    @Transactional
    public ContractResponse update(Long id, UpdateContractRequest request) {
        Contract contract = findContract(id);
        applyContractData(
                contract,
                request.contractType(),
                request.startDate(),
                request.endDate(),
                request.status(),
                request.notes()
        );
        return toResponse(contractRepository.save(contract));
    }

    @Transactional
    public ContractResponse renew(Long id, RenewContractRequest request) {
        Contract previous = findContract(id);
        Contract contract = new Contract();
        contract.setEmployee(previous.getEmployee());
        contract.setPreviousContract(previous);
        applyContractData(
                contract,
                request.contractType(),
                request.startDate(),
                request.endDate(),
                request.status(),
                request.notes()
        );
        return toResponse(contractRepository.save(contract));
    }

    @Transactional
    public ContractDocumentResponse uploadDocument(Long contractId, MultipartFile file) {
        Contract contract = findContract(contractId);
        validateDocument(file);

        try {
            ContractDocument document = new ContractDocument();
            document.setContract(contract);
            document.setFileName(normalizeFileName(file.getOriginalFilename()));
            document.setContentType(normalizeContentType(file.getContentType()));
            document.setFileSize(file.getSize());
            document.setFileData(file.getBytes());
            return toDocumentResponse(contractDocumentRepository.save(document));
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo leer el documento del contrato.");
        }
    }

    @Transactional(readOnly = true)
    public List<ContractDocumentResponse> listDocuments(Long contractId) {
        findContract(contractId);
        return contractDocumentRepository.findByContractIdOrderByUploadedAtDesc(contractId).stream()
                .map(this::toDocumentResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ContractDocument downloadDocument(Long contractId, Long documentId) {
        ContractDocument document = contractDocumentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Contract document not found."));

        if (!document.getContract().getId().equals(contractId)) {
            throw new EntityNotFoundException("Contract document not found.");
        }

        return document;
    }

    private Employee findEmployee(Long employeeId) {
        return employeeRepository.findDetailedById(employeeId)
                .orElseThrow(() -> new EntityNotFoundException("Employee not found."));
    }

    private Contract findContract(Long id) {
        return contractRepository.findDetailedById(id)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found."));
    }

    private void applyContractData(
            Contract contract,
            String contractType,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String notes
    ) {
        if (endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("End date cannot be earlier than start date.");
        }

        contract.setContractType(ContractType.valueOf(contractType.trim().toUpperCase()));
        contract.setStartDate(startDate);
        contract.setEndDate(endDate);
        contract.setStatus(ContractStatus.valueOf(status.trim().toUpperCase()));
        contract.setNotes(normalizeNullable(notes));
    }

    private ContractResponse toResponse(Contract contract) {
        return new ContractResponse(
                contract.getId(),
                contract.getEmployee().getId(),
                contract.getEmployee().getUser().getFullName(),
                contract.getEmployee().getUser().getEmail(),
                contract.getEmployee().getPosition().getArea().getName(),
                contract.getEmployee().getPosition().getName(),
                contract.getEmployee().getSite().getName(),
                contract.getContractType().name(),
                contract.getStartDate(),
                contract.getEndDate(),
                contract.getStatus().name(),
                contract.getNotes(),
                contract.getPreviousContract() != null ? contract.getPreviousContract().getId() : null,
                contractDocumentRepository.countByContractId(contract.getId())
        );
    }

    private ContractDocumentResponse toDocumentResponse(ContractDocument document) {
        return new ContractDocumentResponse(
                document.getId(),
                document.getContract().getId(),
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                document.getUploadedAt()
        );
    }

    private void validateDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Debe seleccionar un documento.");
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE_BYTES) {
            throw new IllegalArgumentException("El documento no puede superar 10 MB.");
        }
    }

    private String normalizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "documento-contrato";
        }
        return fileName.replace("\\", "/").substring(fileName.replace("\\", "/").lastIndexOf('/') + 1);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType;
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
