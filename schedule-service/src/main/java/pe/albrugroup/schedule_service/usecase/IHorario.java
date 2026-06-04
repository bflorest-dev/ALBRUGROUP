package pe.albrugroup.schedule_service.usecase;

import pe.albrugroup.schedule_service.entity.request.PageRequest;
import pe.albrugroup.schedule_service.entity.request.horario.FinalizarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarExcepcionHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.RegistrarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.ReemplazarHorarioRequest;
import pe.albrugroup.schedule_service.entity.request.horario.CorregirHorarioRequest;
import pe.albrugroup.schedule_service.entity.response.PageResponse;
import pe.albrugroup.schedule_service.entity.response.horario.ExcepcionHorarioResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioMesResponse;
import pe.albrugroup.schedule_service.entity.response.horario.HorarioResponse;

import java.time.LocalDate;

public interface IHorario {
    HorarioResponse registrarHorario(RegistrarHorarioRequest request);
    HorarioResponse reemplazarHorario(Long idHorario, ReemplazarHorarioRequest request);
    HorarioResponse corregirHorario(Long idHorario, CorregirHorarioRequest request);
    HorarioResponse finalizarHorario(Long idHorario, FinalizarHorarioRequest request);
    ExcepcionHorarioResponse registrarExcepcion(Long idHorario, RegistrarExcepcionHorarioRequest request);
    ExcepcionHorarioResponse actualizarExcepcion(Long idHorario, Long idExcepcion, RegistrarExcepcionHorarioRequest request);
    void eliminarExcepcion(Long idHorario, Long idExcepcion);
    HorarioMesResponse getHorarioMes(Integer anio, Integer mes);
    HorarioResponse getHorarioVigente(Long idEmpleado, LocalDate fecha);
    PageResponse<HorarioResponse> listarHistorico(Long idEmpleado, PageRequest pageRequest);
}
