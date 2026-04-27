package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanResponse {

    private Long id;
    private String nombre;
    private BigDecimal precio;
    private BigDecimal precioPromocional;
    private Integer mesesPromocionPrecio;
    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;
    private Long idProveedor;
    private String nombreProveedor;
    private InternetResponse internet;
    private TelevisionResponse television;
    private TelefonoResponse telefono;
    private Integer velocidadPromocional;
    private Integer mesesPromocionVelocidad;
    private Long idZona;
    private String nombreZona;
    private List<PlanAdicionalResponse> adicionales;
    private Boolean activo;
}
