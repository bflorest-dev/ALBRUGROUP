package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoEntregaCredencial;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
public class EntregaCredencialPlataformaResponse {

    private Long id;
    private Long idLead;
    private Long idCredencial;
    private String plataforma;
    private String paquete;
    private String usuario;
    private Integer cantidadUsuariosAsignados;
    private Boolean esObsequio;
    private BigDecimal montoVenta;
    private LocalDate fechaEntrega;
    private LocalDate fechaInicioAcceso;
    private LocalDate fechaFinAcceso;
    private EstadoEntregaCredencial estado;
    private Long idAsesorEntrega;
    private String nombreAsesorEntrega;
    private String observacion;
    private List<EntregaCredencialDispositivoResponse> dispositivos;
    private Instant createdAt;
    private Instant updatedAt;
}
