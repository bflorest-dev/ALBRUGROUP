package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class NotFoundException extends  BusinessException {

    public NotFoundException(Class<?> resourceClass, Object id) {
        super(
                HttpStatus.NOT_FOUND,
                resourceClass.getSimpleName() + " no encontrado",
                id
        );
    }
}
