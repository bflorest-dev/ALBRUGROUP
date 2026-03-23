package pe.albrugroup.recruitment_service.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends  BussinessException {

    public NotFoundException(Class<?> resourceClass, Object id) {
        super(
                HttpStatus.NOT_FOUND, id,
                resourceClass.getSimpleName() + " no encontrado"
        );
    }
}
