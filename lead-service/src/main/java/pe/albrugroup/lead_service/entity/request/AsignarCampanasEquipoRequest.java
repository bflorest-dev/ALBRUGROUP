package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AsignarCampanasEquipoRequest {

    /** Reemplaza el conjunto de campañas operativas del equipo. */
    @NotNull(message = "La lista de campañas es obligatoria (puede ir vacía)")
    @Builder.Default
    private Set<Long> campanaIds = new HashSet<>();
}
