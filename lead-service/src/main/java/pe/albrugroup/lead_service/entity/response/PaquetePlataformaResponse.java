package pe.albrugroup.lead_service.entity.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
public class PaquetePlataformaResponse {

    private Long id;
    private Long idPlataforma;
    private String plataforma;
    private String nombre;
    private Integer cantidadMeses;
    private Integer cantidadUsuarios;
    private Boolean consumeCreditos;
    private Integer cantidadCreditosConsumidos;
    private BigDecimal precioVenta;
    private Boolean activo;
    private Instant createdAt;
    private Instant updatedAt;
}
