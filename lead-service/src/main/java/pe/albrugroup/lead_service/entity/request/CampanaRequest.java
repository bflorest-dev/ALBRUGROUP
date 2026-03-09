package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class CampanaRequest {

    @NotBlank private String nombre;
    @NotBlank private String numeroWhatsappEmpresa;
    @NotNull private Long idCuentaPublicitaria;
    @NotNull private Long idProveedor;
}
