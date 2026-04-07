package pe.albrugroup.auth_service.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends BusinessException {

    public NotFoundException(Class<?> resourceClass, Object id) {
        super(HttpStatus.NOT_FOUND, resourceClass.getSimpleName() + " no encontrado", id);
    }

    public NotFoundException(String message, Object id, Object details) {
        super(HttpStatus.NOT_FOUND, message, id, details);
    }

    public NotFoundException(String message, Object id) {
        super(HttpStatus.NOT_FOUND, message, id);
    }

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}
