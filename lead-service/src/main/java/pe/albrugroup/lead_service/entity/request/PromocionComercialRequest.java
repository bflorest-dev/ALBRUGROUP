package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PromocionComercialRequest {

    @NotBlank private String reglaComercial;
    private Long idProveedor;
    private Long idZona;
    private List<Long> idsPlanes;
}
