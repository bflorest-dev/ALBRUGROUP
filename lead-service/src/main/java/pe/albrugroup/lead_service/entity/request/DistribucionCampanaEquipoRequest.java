package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Destino final de una campaña dentro de la distribución completa de un proveedor. */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DistribucionCampanaEquipoRequest {

    @NotNull
    @Positive
    private Long idCampana;

    /** Null representa una campaña activa sin equipo operativo asignado. */
    @Positive
    private Long idEquipo;
}
