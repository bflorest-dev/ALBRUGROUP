package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumenAsistenciaResponse {

    private Long idEmpleado;
    private LocalDate desde;
    private LocalDate hasta;
    private Integer diasConRegistro;
    private Integer diasCerrados;
    private Integer minutosObjetivo;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosServiciosPermitidos;
    private Integer minutosServiciosAcumulados;
}
