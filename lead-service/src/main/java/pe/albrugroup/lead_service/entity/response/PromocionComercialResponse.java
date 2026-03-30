package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromocionComercialResponse {

    private Long id;
    private String nombre;
    private Boolean interno;
    private Long idProveedor;
    private String nombreProveedor;
    private Long idZona;
    private String nombreZona;
    private Boolean descuento;
    private Integer cantidadMeses;
    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;
    private Boolean activo;
    private Instant createdAt;
}
