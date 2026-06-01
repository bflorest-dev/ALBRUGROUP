package pe.albrugroup.rrhh_service.integration.schedule;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import pe.albrugroup.rrhh_service.exception.AuthServiceException;

@Component
@RequiredArgsConstructor
public class ScheduleServiceClient {

    @Qualifier("scheduleRestTemplate")
    private final RestTemplate scheduleRestTemplate;

    public void notificarBajaEmpleado(String authHeader, Long empleadoId) {
        HttpEntity<Void> entity = new HttpEntity<>(buildHeaders(authHeader));
        try {
            scheduleRestTemplate.exchange(
                    "/bajas/empleado/{empleadoId}",
                    HttpMethod.POST,
                    entity,
                    Void.class,
                    empleadoId
            );
        } catch (RestClientResponseException e) {
            throw AuthServiceException.from(e);
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
