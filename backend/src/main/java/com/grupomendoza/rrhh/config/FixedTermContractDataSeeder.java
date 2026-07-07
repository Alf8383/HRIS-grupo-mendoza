package com.grupomendoza.rrhh.config;

import com.grupomendoza.rrhh.area.Area;
import com.grupomendoza.rrhh.area.AreaRepository;
import com.grupomendoza.rrhh.common.status.RecordStatus;
import com.grupomendoza.rrhh.contract.Contract;
import com.grupomendoza.rrhh.contract.ContractDocument;
import com.grupomendoza.rrhh.contract.ContractDocumentRepository;
import com.grupomendoza.rrhh.contract.ContractRepository;
import com.grupomendoza.rrhh.contract.ContractStatus;
import com.grupomendoza.rrhh.contract.ContractType;
import com.grupomendoza.rrhh.employee.Employee;
import com.grupomendoza.rrhh.employee.EmployeeRepository;
import com.grupomendoza.rrhh.employee.EmployeeStatus;
import com.grupomendoza.rrhh.position.Position;
import com.grupomendoza.rrhh.position.PositionRepository;
import com.grupomendoza.rrhh.role.Role;
import com.grupomendoza.rrhh.role.RoleName;
import com.grupomendoza.rrhh.role.RoleRepository;
import com.grupomendoza.rrhh.site.Site;
import com.grupomendoza.rrhh.site.SiteRepository;
import com.grupomendoza.rrhh.user.User;
import com.grupomendoza.rrhh.user.UserRepository;
import com.grupomendoza.rrhh.user.UserStatus;
import java.io.IOException;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(3)
public class FixedTermContractDataSeeder implements ApplicationRunner {
    private static final String AREA_NAME = "Operaciones Tienda";
    private static final String SITE_NAME = "Vía de Evitamiento";
    private static final LocalDate START_DATE = LocalDate.of(2025, 9, 1);
    private static final LocalDate END_DATE = LocalDate.of(2025, 11, 30);
    private static final String CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private static final List<WorkerContractSeed> WORKERS = List.of(
            new WorkerContractSeed("ALFREDO CERDÁN MENDOZA", "41904856", "ADMINISTRADOR TIENDA", "CONTRATO-A-PLAZO-FIJO-ALFREDO-CERDAN.docx"),
            new WorkerContractSeed("ALIPIO RAICO HUACCHA", "76581088", "VENDEDORA", "CONTRATO-A-PLAZO-FIJO-ALIPIO-RAICO.docx"),
            new WorkerContractSeed("CÉSAR RUBERLI QUISPE ZELADA", "71823249", "ALMACENERO", "CONTRATO-A-PLAZO-FIJO-CESAR-QUISPE.docx"),
            new WorkerContractSeed("DANIS ROEL RUIZ RAICO", "71826844", "VENDEDOR", "CONTRATO-A-PLAZO-FIJO-DANIS-RUIZ.docx"),
            new WorkerContractSeed("ERIKA MEDALY MARÍN JARA", "74502040", "VENDEDORA", "CONTRATO-A-PLAZO-FIJO-ERIKA-MARIN.docx"),
            new WorkerContractSeed("JORGE LLANOS HUAMÁN", "48312161", "ALMACENERO", "CONTRATO-A-PLAZO-FIJO-JORGE-LLANOS.docx"),
            new WorkerContractSeed("JOSÉ CERDÁN MENDOZA", "48022128", "ADMINISTRADOR GENERAL", "CONTRATO-A-PLAZO-FIJO-JOSE-CERDAN.docx"),
            new WorkerContractSeed("JOSELITO SÁNCHEZ SALDAÑA", "76389768", "ALMACENERO", "CONTRATO-A-PLAZO-FIJO-JOSELITO-SANCHEZ.docx"),
            new WorkerContractSeed("KERLY YAMALI GARCÍA ABANTO", "71600251", "VENDEDORA", "CONTRATO-A-PLAZO-FIJO-KERLY-GARCIA.docx"),
            new WorkerContractSeed("LUIS DAVID CHUQUIRUNA ZELADA", "71843274", "ALMACENERO", "CONTRATO-A-PLAZO-FIJO-LUIS-CHUQUIRUNA.docx"),
            new WorkerContractSeed("LUIS MELBIN TERRONES PORTAL", "73503509", "ALMACENERO", "CONTRATO-A-PLAZO-FIJO-LUIS-TERRONES.docx"),
            new WorkerContractSeed("MARCOS ANTONIO CERDÁN MENDOZA", "70789616", "ADMINISTRADOR TIENDA", "CONTRATO-A-PLAZO-FIJO-MARCOS-CERDAN.docx"),
            new WorkerContractSeed("NOEL CERDÁN MENDOZA", "40812191", "ADMINISTRADOR TIENDA", "CONTRATO-A-PLAZO-FIJO-NOEL-CERDAN.docx"),
            new WorkerContractSeed("RUBÉN MARDOQUEO GUTIÉRREZ RAYCO", "75383521", "ALMACENERO", "CONTRATO-A-PLAZO-FIJO-RUBEN-GUTIERREZ.docx"),
            new WorkerContractSeed("ZENAIDA CERDÁN MENDOZA", "47441751", "ADMINISTRADOR TIENDA", "CONTRATO-A-PLAZO-FIJO-ZENAIDA-CERDAN.docx")
    );

    private final FixedTermContractSeedProperties seedProperties;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final AreaRepository areaRepository;
    private final SiteRepository siteRepository;
    private final PositionRepository positionRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final ContractDocumentRepository contractDocumentRepository;
    private final PasswordEncoder passwordEncoder;

    public FixedTermContractDataSeeder(
            FixedTermContractSeedProperties seedProperties,
            RoleRepository roleRepository,
            UserRepository userRepository,
            AreaRepository areaRepository,
            SiteRepository siteRepository,
            PositionRepository positionRepository,
            EmployeeRepository employeeRepository,
            ContractRepository contractRepository,
            ContractDocumentRepository contractDocumentRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.seedProperties = seedProperties;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.areaRepository = areaRepository;
        this.siteRepository = siteRepository;
        this.positionRepository = positionRepository;
        this.employeeRepository = employeeRepository;
        this.contractRepository = contractRepository;
        this.contractDocumentRepository = contractDocumentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!seedProperties.isEnabled()) {
            return;
        }

        Role employeeRole = roleRepository.findByName(RoleName.EMPLOYEE)
                .orElseThrow(() -> new IllegalStateException("EMPLOYEE role must exist before loading fixed-term contracts."));
        Area area = ensureArea();
        Site site = ensureSite();

        for (WorkerContractSeed worker : WORKERS) {
            Position position = ensurePosition(area, worker.positionName());
            User user = ensureUser(worker, employeeRole);
            Employee employee = ensureEmployee(worker, user, position, site);
            Contract contract = ensureContract(employee);
            ensureContractDocument(contract, worker.fileName());
        }
    }

    private Area ensureArea() {
        return areaRepository.findByNameIgnoreCase(AREA_NAME).orElseGet(() -> {
            Area area = new Area();
            area.setName(AREA_NAME);
            area.setDescription("Área para trabajadores cargados desde contratos a plazo fijo.");
            area.setStatus(RecordStatus.ACTIVE);
            return areaRepository.save(area);
        });
    }

    private Site ensureSite() {
        return siteRepository.findByNameIgnoreCase(SITE_NAME).orElseGet(() -> {
            Site site = new Site();
            site.setName(SITE_NAME);
            site.setDescription("Sede principal de los contratos importados.");
            site.setStatus(RecordStatus.ACTIVE);
            return siteRepository.save(site);
        });
    }

    private Position ensurePosition(Area area, String name) {
        return positionRepository.findByAreaIdAndNameIgnoreCase(area.getId(), name).orElseGet(() -> {
            Position position = new Position();
            position.setArea(area);
            position.setName(name);
            position.setDescription("Cargo importado desde contrato a plazo fijo.");
            position.setStatus(RecordStatus.ACTIVE);
            return positionRepository.save(position);
        });
    }

    private User ensureUser(WorkerContractSeed worker, Role employeeRole) {
        String email = worker.email();
        return userRepository.findByEmailIgnoreCase(email).map(user -> {
            user.setFullName(worker.fullName());
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(new LinkedHashSet<>(Set.of(employeeRole)));
            return userRepository.save(user);
        }).orElseGet(() -> {
            User user = new User();
            user.setFullName(worker.fullName());
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(seedProperties.getDefaultPassword()));
            user.setStatus(UserStatus.ACTIVE);
            user.setRoles(new LinkedHashSet<>(Set.of(employeeRole)));
            return userRepository.save(user);
        });
    }

    private Employee ensureEmployee(WorkerContractSeed worker, User user, Position position, Site site) {
        Optional<Employee> existingByUser = employeeRepository.findByUserId(user.getId());
        if (existingByUser.isPresent()) {
            Employee employee = existingByUser.get();
            employee.setPosition(position);
            employee.setSite(site);
            employee.setDni(worker.dni());
            employee.setBiometricCode(worker.dni());
            employee.setHireDate(START_DATE);
            employee.setStatus(EmployeeStatus.ACTIVE);
            return employeeRepository.save(employee);
        }

        if (employeeRepository.existsByDniIgnoreCase(worker.dni())) {
            throw new IllegalStateException("Imported contract DNI already belongs to another employee: " + worker.dni());
        }

        Employee employee = new Employee();
        employee.setUser(user);
        employee.setPosition(position);
        employee.setSite(site);
        employee.setDni(worker.dni());
        employee.setBiometricCode(worker.dni());
        employee.setPhone(null);
        employee.setHireDate(START_DATE);
        employee.setStatus(EmployeeStatus.ACTIVE);
        return employeeRepository.save(employee);
    }

    private Contract ensureContract(Employee employee) {
        return contractRepository.findByEmployeeIdDetailed(employee.getId()).stream()
                .filter(contract -> ContractType.FIXED_TERM.equals(contract.getContractType())
                        && START_DATE.equals(contract.getStartDate())
                        && END_DATE.equals(contract.getEndDate()))
                .findFirst()
                .orElseGet(() -> {
                    Contract contract = new Contract();
                    contract.setEmployee(employee);
                    contract.setContractType(ContractType.FIXED_TERM);
                    contract.setStartDate(START_DATE);
                    contract.setEndDate(END_DATE);
                    contract.setStatus(ContractStatus.EXPIRED);
                    contract.setNotes("Contrato a plazo fijo importado desde documento firmado.");
                    return contractRepository.save(contract);
                });
    }

    private void ensureContractDocument(Contract contract, String fileName) {
        if (contractDocumentRepository.countByContractId(contract.getId()) > 0) {
            return;
        }

        ClassPathResource resource = new ClassPathResource("seed/contracts/" + fileName);
        try {
            byte[] fileData = resource.getContentAsByteArray();

            ContractDocument document = new ContractDocument();
            document.setContract(contract);
            document.setFileName(fileName);
            document.setContentType(CONTENT_TYPE);
            document.setFileSize((long) fileData.length);
            document.setFileData(fileData);
            contractDocumentRepository.save(document);
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load contract document resource: " + fileName, exception);
        }
    }

    private record WorkerContractSeed(String fullName, String dni, String positionName, String fileName) {
        private String email() {
            return "trabajador." + dni + "@grupomendoza.com".toLowerCase(Locale.ROOT);
        }
    }
}
