package pe.albrugroup.schedule_service.usecase;

import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoActualResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.HistorialAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.ResumenAsistenciaResponse;

import java.time.LocalDate;
import java.util.List;

public interface IAsistencia {
    DetalleAsistenciaResponse registrarIngreso(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse registrarSalida(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse iniciarAlmuerzo(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse finalizarAlmuerzo(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse iniciarServicios(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse finalizarServicios(MovimientoAsistenciaRequest request);
    EstadoActualResponse getEstadoActual(LocalDate fecha);
    EstadoActualResponse getEstadoActual(Long idEmpleado, LocalDate fecha);
    DetalleAsistenciaResponse getAsistenciaDia(LocalDate fecha);
    DetalleAsistenciaResponse getAsistenciaDia(Long idEmpleado, LocalDate fecha);
    ResumenAsistenciaResponse getResumenSemanal(LocalDate fecha);
    ResumenAsistenciaResponse getResumenSemanal(Long idEmpleado, LocalDate fecha);
    ResumenAsistenciaResponse getResumenMensual(LocalDate fecha);
    ResumenAsistenciaResponse getResumenMensual(Long idEmpleado, LocalDate fecha);
    List<HistorialAsistenciaResponse> getHistorial(LocalDate desde, LocalDate hasta);
    List<HistorialAsistenciaResponse> getHistorial(Long idEmpleado, LocalDate desde, LocalDate hasta);
    List<EstadoMonitorResponse> getEstadosMonitor(ConsultaMonitoreoRequest request);
}
