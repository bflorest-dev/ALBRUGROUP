package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CampanaRequest {

    @NotBlank private String nombre;
    @NotBlank private String numeroEmpresa;
    @NotBlank private String cuentaPublicitaria;
    @NotBlank private String nombreCuentaPublicitaria;
}
