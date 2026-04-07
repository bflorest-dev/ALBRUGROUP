package pe.albrugroup.rrhh_service.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class UpstreamServiceException extends BusinessException {

    private final String serviceName;

    public UpstreamServiceException(HttpStatus status, String serviceName, String message, Object details) {
        super(status, message, null, details);
        this.serviceName = serviceName;
    }

}
