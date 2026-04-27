package pe.albrugroup.schedule_service.entity.response.asistencia;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CumplimientoResumenEmpleadoResponse {

    private Long idEmpleado;
    private Integer diasLaborables;
    private Integer diasConRegistro;
    private Integer diasSinRegistro;
    private Integer diasCerrados;
    private Integer cantidadTardanzas;
    private Integer minutosObjetivo;
    private Integer minutosTrabajados;
    private Integer minutosBalance;
    private Integer minutosServiciosAcumulados;
    private Integer cantidadDiasConExcesoServicios;
}
