package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PromocionComercialRequest {

    @NotBlank private String nombre;
    @NotNull private Boolean interno;
    private Long idProveedor;
    private Long idZona;
    @NotNull private Boolean descuento;
    @NotNull private Integer cantidadMeses;
    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;
}
