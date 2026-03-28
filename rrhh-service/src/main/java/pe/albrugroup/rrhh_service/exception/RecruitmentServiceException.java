package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.client.RestClientResponseException;

public class RecruitmentServiceException extends BusinessException {

    public RecruitmentServiceException(HttpStatus status, String message, String details) {
        super(status, message, null, details);
    }

    public static RecruitmentServiceException from(RestClientResponseException e) {
        HttpStatus status = HttpStatus.resolve(e.getRawStatusCode());
        if (status == null) {
            status = HttpStatus.BAD_GATEWAY;
        }
        String details = e.getResponseBodyAsString();
        String message = "Error comunicandose con recruitment-service";
        return new RecruitmentServiceException(status, message, details);
    }
}
