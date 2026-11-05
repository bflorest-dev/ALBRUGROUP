package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** Representación completa de las campañas activas de un proveedor para un PUT atómico. */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DistribucionCampanasProveedorRequest {

    @NotNull(message = "La distribución de campañas es obligatoria")
    @Valid
    @Builder.Default
    private List<DistribucionCampanaEquipoRequest> asignaciones = new ArrayList<>();
}
