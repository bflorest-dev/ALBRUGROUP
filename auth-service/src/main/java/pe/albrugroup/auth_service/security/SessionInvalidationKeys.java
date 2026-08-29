package pe.albrugroup.auth_service.security;

public final class SessionInvalidationKeys {

    private static final String PREFIX = "auth:session-invalidated-at:";

    private SessionInvalidationKeys() {
    }

    public static String userKey(Long empleadoId) {
        return PREFIX + empleadoId;
    }
}
