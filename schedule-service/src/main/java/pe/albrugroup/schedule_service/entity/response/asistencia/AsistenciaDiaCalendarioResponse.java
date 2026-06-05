package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsistenciaDiaCalendarioResponse {

    private LocalDate fecha;
    private Boolean laborable;
    private LocalTime horaEntradaEstablecida;
    private LocalTime horaEntradaAsistencia;
    private LocalTime horaSalidaEstablecida;
    private LocalTime horaSalidaAsistencia;
    private Boolean jornadaCerrada;

    /** Tramos del dia cuando fue partido por una ampliacion (reapertura). Vacio en dias normales. */
    private List<TramoAsistenciaResponse> tramos;
}
