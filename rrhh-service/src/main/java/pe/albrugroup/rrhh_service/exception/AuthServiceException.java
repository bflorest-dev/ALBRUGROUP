package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientResponseException;

public class AuthServiceException extends UpstreamServiceException {

    public AuthServiceException(HttpStatus status, String message, String details) {
        super(status, "auth-service", message, details);
    }

    public static AuthServiceException from(RestClientResponseException e) {
        HttpStatus status = HttpStatus.resolve(e.getRawStatusCode());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        String details = e.getResponseBodyAsString();
        String message = "Error comunicandose con auth-service";
        return new AuthServiceException(status, message, details);
    }
}
