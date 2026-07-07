package com.grupomendoza.rrhh.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.seed.admin-third")
public class ThirdAdminSeedProperties {
    private boolean enabled;
    private boolean removeLegacyAdmin2;
    private String fullName;
    private String email;
    private String password;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isRemoveLegacyAdmin2() {
        return removeLegacyAdmin2;
    }

    public void setRemoveLegacyAdmin2(boolean removeLegacyAdmin2) {
        this.removeLegacyAdmin2 = removeLegacyAdmin2;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
