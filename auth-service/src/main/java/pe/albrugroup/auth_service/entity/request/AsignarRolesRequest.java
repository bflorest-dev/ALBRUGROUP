package pe.albrugroup.auth_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AsignarRolesRequest {

    @NotBlank(message = "El rol principal es obligatorio")
    private String rolPrincipal;

    @Builder.Default
    private List<String> rolesSecundarios = new ArrayList<>();
}
