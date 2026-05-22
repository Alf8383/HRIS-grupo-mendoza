package com.grupomendoza.rrhh.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed.users")
public class AdditionalSeedUsersProperties {
    private boolean hrEnabled;
    private String hrFullName;
    private String hrEmail;
    private String hrPassword;
    private boolean managerEnabled;
    private String managerFullName;
    private String managerEmail;
    private String managerPassword;
    private boolean employeeEnabled;
    private String employeeFullName;
    private String employeeEmail;
    private String employeePassword;

    public boolean isHrEnabled() {
        return hrEnabled;
    }

    public void setHrEnabled(boolean hrEnabled) {
        this.hrEnabled = hrEnabled;
    }

    public String getHrFullName() {
        return hrFullName;
    }

    public void setHrFullName(String hrFullName) {
        this.hrFullName = hrFullName;
    }

    public String getHrEmail() {
        return hrEmail;
    }

    public void setHrEmail(String hrEmail) {
        this.hrEmail = hrEmail;
    }

    public String getHrPassword() {
        return hrPassword;
    }

    public void setHrPassword(String hrPassword) {
        this.hrPassword = hrPassword;
    }

    public boolean isManagerEnabled() {
        return managerEnabled;
    }

    public void setManagerEnabled(boolean managerEnabled) {
        this.managerEnabled = managerEnabled;
    }

    public String getManagerFullName() {
        return managerFullName;
    }

    public void setManagerFullName(String managerFullName) {
        this.managerFullName = managerFullName;
    }

    public String getManagerEmail() {
        return managerEmail;
    }

    public void setManagerEmail(String managerEmail) {
        this.managerEmail = managerEmail;
    }

    public String getManagerPassword() {
        return managerPassword;
    }

    public void setManagerPassword(String managerPassword) {
        this.managerPassword = managerPassword;
    }

    public boolean isEmployeeEnabled() {
        return employeeEnabled;
    }

    public void setEmployeeEnabled(boolean employeeEnabled) {
        this.employeeEnabled = employeeEnabled;
    }

    public String getEmployeeFullName() {
        return employeeFullName;
    }

    public void setEmployeeFullName(String employeeFullName) {
        this.employeeFullName = employeeFullName;
    }

    public String getEmployeeEmail() {
        return employeeEmail;
    }

    public void setEmployeeEmail(String employeeEmail) {
        this.employeeEmail = employeeEmail;
    }

    public String getEmployeePassword() {
        return employeePassword;
    }

    public void setEmployeePassword(String employeePassword) {
        this.employeePassword = employeePassword;
    }
}
