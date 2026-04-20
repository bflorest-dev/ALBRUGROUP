package pe.albrugroup.schedule_service.service.mapper;

import org.mapstruct.Mapper;
import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.response.asistencia.DetalleAsistenciaResponse;
import pe.albrugroup.schedule_service.entity.response.asistencia.HistorialAsistenciaResponse;

@Mapper(componentModel = "spring")
public interface AsistenciaMapper {

    default DetalleAsistenciaResponse toDetalleResponse(Asistencia entity) {
        return DetalleAsistenciaResponse.builder()
                .idEmpleado(entity.getIdEmpleado())
                .idHorario(entity.getIdHorario())
                .fecha(entity.getFecha())
                .entradaProgramada(entity.getEntradaProgramada())
                .salidaProgramada(entity.getSalidaProgramada())
                .inicioAlmuerzoProgramado(entity.getInicioAlmuerzoProgramado())
                .finAlmuerzoProgramado(entity.getFinAlmuerzoProgramado())
                .fechaHoraIngreso(entity.getFechaHoraIngreso())
                .fechaHoraSalida(entity.getFechaHoraSalida())
                .fechaHoraInicioAlmuerzo(entity.getFechaHoraInicioAlmuerzo())
                .fechaHoraFinAlmuerzo(entity.getFechaHoraFinAlmuerzo())
                .minutosObjetivoDia(entity.getMinutosObjetivoDia())
                .minutosTrabajados(entity.getMinutosTrabajados())
                .minutosBalance(entity.getMinutosBalance())
                .minutosAlmuerzoTomados(entity.getMinutosAlmuerzoTomados())
                .minutosServiciosPermitidos(entity.getMinutosServiciosPermitidos())
                .minutosServiciosAcumulados(entity.getMinutosServiciosAcumulados())
                .excedioServicios(entity.getExcedioServicios())
                .jornadaCerrada(entity.getFechaHoraSalida() != null)
                .build();
    }

    default HistorialAsistenciaResponse toHistorialResponse(Asistencia entity) {
        return HistorialAsistenciaResponse.builder()
                .fecha(entity.getFecha())
                .fechaHoraIngreso(entity.getFechaHoraIngreso())
                .fechaHoraSalida(entity.getFechaHoraSalida())
                .minutosObjetivoDia(entity.getMinutosObjetivoDia())
                .minutosTrabajados(entity.getMinutosTrabajados())
                .minutosBalance(entity.getMinutosBalance())
                .minutosAlmuerzoTomados(entity.getMinutosAlmuerzoTomados())
                .minutosServiciosAcumulados(entity.getMinutosServiciosAcumulados())
                .excedioServicios(entity.getExcedioServicios())
                .jornadaCerrada(entity.getFechaHoraSalida() != null)
                .build();
    }
}
