package pe.albrugroup.lead_service.presence;

public final class PresenceKeys {

    private PresenceKeys() {
    }

    public static String employeeKey(Long empleadoId) {
        return "presence:employee:" + empleadoId;
    }

    public static String employeePattern() {
        return "presence:employee:*";
    }

    public static String rolePattern(String role) {
        return "presence:role:" + role + ":*";
    }
}
