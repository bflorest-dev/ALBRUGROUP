package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class AsignarProveedoresRequest {

    // Reemplaza el conjunto de proveedores del equipo.
    @NotNull(message = "La lista de proveedores es obligatoria (puede ir vacía)")
    @Builder.Default
    private Set<Long> proveedorIds = new HashSet<>();
}
