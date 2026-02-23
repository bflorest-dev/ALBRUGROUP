package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Evento;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class EventoResponse {

    private Long id;
    private Long postulanteId;
    private Long responsableId;
    private EtapaProceso etapaProceso;
    private Evento evento;
    private String estado;
    private String subestado;
    private Instant fechaCreacion;
    private Instant fechaEvento;
    private LocalDate inicioCapa;
    private LocalDate finCapa;
    private BigDecimal pagoDiaCapa;
}
