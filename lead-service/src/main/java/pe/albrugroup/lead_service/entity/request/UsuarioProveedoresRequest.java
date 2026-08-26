package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class UsuarioProveedoresRequest {

    @NotNull(message = "La lista de proveedores es obligatoria (puede ir vacia)")
    private Set<Long> proveedorIds = new HashSet<>();
}
