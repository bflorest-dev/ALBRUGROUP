package pe.albrugroup.lead_service.presence;

public final class PresenceKeys {

    private PresenceKeys() {
    }

    public static String employeeKey(Long empleadoId) {
        return "presence:employee:" + empleadoId;
    }

    public static String employeeIndexKey() {
        return "presence:employees";
    }

    public static String roleIndexKey(String role) {
        return "presence:role:" + role + ":employees";
    }
}
