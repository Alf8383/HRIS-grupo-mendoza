package com.grupomendoza.rrhh.contract;

import com.grupomendoza.rrhh.contract.dto.ContractResponse;
import com.grupomendoza.rrhh.contract.dto.CreateContractRequest;
import com.grupomendoza.rrhh.contract.dto.ExpiringContractResponse;
import com.grupomendoza.rrhh.contract.dto.RenewContractRequest;
import com.grupomendoza.rrhh.contract.dto.UpdateContractRequest;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContractService {
    private static final int EXPIRING_THRESHOLD_DAYS = 30;

    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;

    public ContractService(ContractRepository contractRepository, EmployeeRepository employeeRepository) {
        this.contractRepository = contractRepository;
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
                contract.getPreviousContract() != null ? contract.getPreviousContract().getId() : null
        );
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
