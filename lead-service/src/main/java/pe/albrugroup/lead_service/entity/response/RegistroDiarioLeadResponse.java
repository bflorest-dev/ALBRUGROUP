package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

/**
 * Un evento REGISTRO del lead en el día, para el despliegue de repeticiones en "Leads del día".
 * Expone solo lo que la fila necesita: hora, GTR que registró y campaña de ese registro.
 */
@Getter
@AllArgsConstructor
public class RegistroDiarioLeadResponse {

    private Instant createdAt;
    private String nombreActor;
    private String nombreCampana;
}
