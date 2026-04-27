package pe.albrugroup.schedule_service.usecase;

import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaCumplimientoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.ConsultaMonitoreoRequest;
import pe.albrugroup.schedule_service.entity.request.asistencia.MovimientoAsistenciaRequest;
import pe.albrugroup.schedule_service.entity.response.asistencia.AsistenciaMesResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoDetalleResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.CumplimientoResumenResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.EstadoMonitorResponse;

import java.time.LocalDate;
import java.util.List;

public interface IAsistencia {
    DetalleAsistenciaResponse registrarIngreso(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse registrarSalida(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse iniciarAlmuerzo(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse finalizarAlmuerzo(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse iniciarServicios(MovimientoAsistenciaRequest request);
    DetalleAsistenciaResponse finalizarServicios(MovimientoAsistenciaRequest request);
    AsistenciaMesResponse getAsistenciaMes(Integer anio, Integer mes);
    DetalleAsistenciaResponse getAsistenciaDia(LocalDate fecha);
    CumplimientoResumenResponse getCumplimientoResumen(ConsultaCumplimientoRequest request);
    CumplimientoDetalleResponse getCumplimientoDetalle(ConsultaCumplimientoRequest request);
    List<EstadoMonitorResponse> getEstadosMonitor(ConsultaMonitoreoRequest request);
}
