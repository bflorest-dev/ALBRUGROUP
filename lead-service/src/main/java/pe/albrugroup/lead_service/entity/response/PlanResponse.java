package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

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
    // Internet (aplanado para el frontend)
    private Integer internetVelocidad;
    private Unidad internetUnidad;
    private Tecnologia internetTecnologia;
    private Integer velocidadPromocional;
    private Integer mesesPromocionVelocidad;
    // Television (aplanado)
    private String televisionNombre;
    private Integer televisionCanales;
    // Telefono (aplanado)
    private Integer telefonoMinutos;
    private String telefonoDescripcion;
    private Long idZona;
    private String nombreZona;
    private List<PlanAdicionalResponse> adicionales;
    private Boolean activo;
}
