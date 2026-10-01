package pe.albrugroup.billing_service.exception;

import org.springframework.http.HttpStatus;

public class BillingException extends RuntimeException {

    private final HttpStatus status;

    public BillingException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
