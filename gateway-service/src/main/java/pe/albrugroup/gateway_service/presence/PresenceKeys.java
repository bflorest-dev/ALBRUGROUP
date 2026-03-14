package pe.albrugroup.gateway_service.presence;

public final class PresenceKeys {

    private PresenceKeys() {
    }

    public static String employeeKey(Long empleadoId) {
        return "presence:employee:" + empleadoId;
    }

    public static String roleKey(String role, Long empleadoId) {
        return "presence:role:" + role + ":" + empleadoId;
    }

    public static String rolePattern(String role) {
        return "presence:role:" + role + ":*";
    }

    public static String rolePatternForEmployee(Long empleadoId) {
        return "presence:role:*:" + empleadoId;
    }
}
