package pe.albrugroup.rrhh_service.exception;

public class NotFoundException extends BusinessException {

    public NotFoundException(Class<?> resourceClass, Object id) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, resourceClass.getSimpleName() + " no encontrado", id);
    }

    public NotFoundException(Class<?> resourceClass) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, resourceClass.getSimpleName() + " no encontrado");
    }

    public NotFoundException(String message, Object id, Object details) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, message, id, details);
    }

    public NotFoundException(String message, Object id) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, message, id);
    }

    public NotFoundException(String message) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, message);
    }
}
