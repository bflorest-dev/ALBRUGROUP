package pe.albrugroup.gateway_service.entity.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Builder
public class EmpleadoEsperadoResponse {

    private Long empleadoId;
    private String nombreCompleto;
    private List<String> roles;
    private LocalDate fecha;
    private LocalTime entradaProgramada;
    private boolean conectado;
    private boolean tieneHorarioVigente;
    private boolean laborableHoy;
    private boolean esperadoHoy;
    private boolean tieneRegistroHoy;
    private String estadoSchedule;
}
