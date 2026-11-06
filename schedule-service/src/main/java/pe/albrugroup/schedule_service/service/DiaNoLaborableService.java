package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.TipoDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.request.horario.DeclararDiaNoLaborableRequest;
import pe.albrugroup.schedule_service.repository.DiaNoLaborableRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Declaracion de dias no laborables (feriados / vacaciones / permisos). Alcance GLOBAL o por EMPLEADO
 * (lista). El "por equipo" lo resuelve el llamador expandiendo el equipo a una lista de empleados.
 */
@Service
@RequiredArgsConstructor
public class DiaNoLaborableService {

    private final DiaNoLaborableRepository repository;
    private final CurrentUser currentUser;

    @Transactional
    public List<DiaNoLaborable> declarar(DeclararDiaNoLaborableRequest request) {
        Long creadoPor = currentUser.empleadoID();
        LocalDate desde = request.getFecha();
        LocalDate hasta = request.getHasta() != null ? request.getHasta() : desde;
        if (hasta.isBefore(desde)) {
            throw new IllegalArgumentException("El fin del rango no puede ser anterior al inicio");
        }
        if (desde.plusDays(366).isBefore(hasta)) {
            throw new IllegalArgumentException("El rango de dias no laborables es demasiado amplio");
        }

        // FERIADO siempre es GLOBAL (para todos), sin importar empleadoIds.
        boolean global = request.getTipo() == TipoDiaNoLaborable.FERIADO
                || request.getEmpleadoIds() == null || request.getEmpleadoIds().isEmpty();
        List<Long> empleados = global
                ? List.of()
                : request.getEmpleadoIds().stream().filter(Objects::nonNull).distinct().toList();

        List<DiaNoLaborable> result = new ArrayList<>();
        for (LocalDate fecha = desde; !fecha.isAfter(hasta); fecha = fecha.plusDays(1)) {
            if (global) {
                result.add(upsert(AlcanceDiaNoLaborable.GLOBAL, null, fecha, request, creadoPor));
            } else {
                for (Long idEmpleado : empleados) {
                    result.add(upsert(AlcanceDiaNoLaborable.EMPLEADO, idEmpleado, fecha, request, creadoPor));
                }
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborable> listar(LocalDate fecha) {
        return repository.findByFecha(fecha);
    }

    private DiaNoLaborable upsert(AlcanceDiaNoLaborable alcance, Long refId, LocalDate fecha,
                                  DeclararDiaNoLaborableRequest request, Long creadoPor) {
        DiaNoLaborable dia = (alcance == AlcanceDiaNoLaborable.GLOBAL
                ? repository.findFirstByAlcanceAndRefIdIsNullAndFecha(AlcanceDiaNoLaborable.GLOBAL, fecha)
                : repository.findFirstByAlcanceAndRefIdAndFecha(AlcanceDiaNoLaborable.EMPLEADO, refId, fecha))
                .orElseGet(() -> DiaNoLaborable.builder()
                        .alcance(alcance).refId(refId).fecha(fecha).build());
        dia.setLaborable(request.isLaborable());
        dia.setTipo(request.getTipo());
        dia.setMotivo(request.getMotivo());
        dia.setCreadoPor(creadoPor);
        return repository.save(dia);
    }
}
