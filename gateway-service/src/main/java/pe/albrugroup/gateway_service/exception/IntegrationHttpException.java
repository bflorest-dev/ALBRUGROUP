package pe.albrugroup.gateway_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

public class IntegrationHttpException extends RuntimeException {

    private final HttpStatus status;
    private final Object details;

    public IntegrationHttpException(HttpStatusCode status, String message, Object details) {
        super(message);
        this.status = HttpStatus.valueOf(status.value());
        this.details = details;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Object getDetails() {
        return details;
    }
}
