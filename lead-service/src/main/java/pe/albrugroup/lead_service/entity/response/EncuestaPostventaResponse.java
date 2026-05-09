package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncuestaPostventaResponse {

    private Long id;
    private Long idLead;
    private Integer calificacionAsesor;
    private Integer calificacionServicio;
    private Instant createdAt;
}
