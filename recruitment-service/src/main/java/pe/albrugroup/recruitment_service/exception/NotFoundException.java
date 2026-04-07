package pe.albrugroup.recruitment_service.exception;

public class NotFoundException extends BussinessException {

    public NotFoundException(Class<?> resourceClass, Object id) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, id, resourceClass.getSimpleName() + " no encontrado");
    }

    public NotFoundException(Class<?> resourceClass) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, resourceClass.getSimpleName() + " no encontrado");
    }

    public NotFoundException(String message, Object id, Object details) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, id, details, message);
    }

    public NotFoundException(String message, Object id) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, id, message);
    }

    public NotFoundException(String message) {
        super(org.springframework.http.HttpStatus.NOT_FOUND, message);
    }
}
