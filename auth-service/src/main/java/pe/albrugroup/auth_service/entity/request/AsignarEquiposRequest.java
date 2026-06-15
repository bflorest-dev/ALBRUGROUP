package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class AsignarEquiposRequest {

    // Reemplaza los equipos del usuario por este conjunto.
    // Roles operativos: exactamente 1. ADMIN/COMMUNITY: vacío (acceso global por permiso).
    @NotNull(message = "La lista de equipos es obligatoria (puede ir vacía)")
    @Builder.Default
    private Set<Long> equipoIds = new HashSet<>();
}
