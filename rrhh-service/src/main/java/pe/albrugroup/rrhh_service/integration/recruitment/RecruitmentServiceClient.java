package pe.albrugroup.rrhh_service.integration.recruitment;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import pe.albrugroup.rrhh_service.exception.RecruitmentServiceException;
import pe.albrugroup.rrhh_service.integration.recruitment.dto.ConfirmarContratacionRequest;

@Component
@RequiredArgsConstructor
public class RecruitmentServiceClient {

    @Qualifier("recruitmentRestTemplate")
    private final RestTemplate recruitmentRestTemplate;

    public void confirmarContratacion(String authHeader, Long idPostulacion, ConfirmarContratacionRequest request) {
        HttpEntity<ConfirmarContratacionRequest> entity = new HttpEntity<>(request, buildHeaders(authHeader));
        try {
            recruitmentRestTemplate.postForEntity(
                    "/postulaciones/{idPostulacion}/confirmar-contratacion",
                    entity,
                    Void.class,
                    idPostulacion
            );
        } catch (RestClientResponseException e) {
            throw RecruitmentServiceException.from(e);
        }
    }

    private HttpHeaders buildHeaders(String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (authHeader != null && !authHeader.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, authHeader);
        }
        return headers;
    }
}
