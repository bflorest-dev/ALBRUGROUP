package pe.albrugroup.schedule_service.exception;

public class NotFoundException extends BusinessException {

    public NotFoundException(Class<?> resourceClass, Object id) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, resourceClass.getSimpleName() + " no encontrado", id);
    }

    public NotFoundException(String message, Object id) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, message, id);
    }

    public NotFoundException(String message) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, message);
    }
}
