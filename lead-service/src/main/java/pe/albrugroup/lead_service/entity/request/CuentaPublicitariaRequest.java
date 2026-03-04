package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CuentaPublicitariaRequest {

    @NotBlank private String numeroCuenta;
    @NotBlank private String nombreCuenta;
}
