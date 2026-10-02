package pe.albrugroup.lead_service.entity.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class RecargaCuentaPublicitariaResponse {

    private Long id;
    private Long idCuentaPublicitaria;
    private String nombreCuenta;
    private BigDecimal monto;
    private LocalDateTime fecha;
    private String observacion;
    private Instant createdAt;
}
