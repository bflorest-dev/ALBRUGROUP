package pe.albrugroup.lead_service.exception;

public class DuplicateResourceException extends ConflictException {

    public DuplicateResourceException(String message, Object details) {
        super(message, null, details);
    }
}
