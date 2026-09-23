package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
public class ReconciliarRolesScopeRequest {

    @NotNull(message = "La lista de roles es obligatoria")
    private Set<String> roles = new HashSet<>();
}
