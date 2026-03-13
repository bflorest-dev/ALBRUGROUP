package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AdicionalRequest {

    @NotNull
    private Long idProveedor;

    @NotBlank
    private String nombre;

    @NotNull
    private BigDecimal precioUnitario;
}
