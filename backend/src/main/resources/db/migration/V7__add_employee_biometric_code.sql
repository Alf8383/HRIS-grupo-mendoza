alter table employees
    add column biometric_code varchar(30);

alter table employees
    add constraint uk_employees_biometric_code unique (biometric_code);
