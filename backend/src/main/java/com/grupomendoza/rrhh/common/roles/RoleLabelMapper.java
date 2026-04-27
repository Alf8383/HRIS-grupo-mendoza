package com.grupomendoza.rrhh.common.roles;

import com.grupomendoza.rrhh.role.RoleName;
import java.util.EnumMap;
import java.util.Map;

public class RoleLabelMapper {
    private static final Map<RoleName, String> LABELS = new EnumMap<>(RoleName.class);

    static {
        LABELS.put(RoleName.ADMIN, "Administrador");
        LABELS.put(RoleName.HR, "Recursos Humanos");
        LABELS.put(RoleName.MANAGER, "Jefe de área");
        LABELS.put(RoleName.EMPLOYEE, "Empleado");
    }

    private RoleLabelMapper() {
    }

    public static String toLabel(RoleName roleName) {
        return LABELS.getOrDefault(roleName, roleName.name());
    }

    public static String toLabel(String roleName) {
        return toLabel(RoleName.valueOf(roleName));
    }
}
