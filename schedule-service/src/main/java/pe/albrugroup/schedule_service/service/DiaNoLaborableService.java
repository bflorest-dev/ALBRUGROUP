package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.schedule_service.configuration.CurrentUser;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;
import pe.albrugroup.schedule_service.entity.request.horario.DeclararDiaNoLaborableRequest;
import pe.albrugroup.schedule_service.repository.DiaNoLaborableRepository;

import java.time.LocalDate;
import java.util.List;

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
        if (request.getEmpleadoIds() == null || request.getEmpleadoIds().isEmpty()) {
            return List.of(upsert(AlcanceDiaNoLaborable.GLOBAL, null, request, creadoPor));
        }
        return request.getEmpleadoIds().stream().filter(java.util.Objects::nonNull).distinct()
                .map(idEmpleado -> upsert(AlcanceDiaNoLaborable.EMPLEADO, idEmpleado, request, creadoPor))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiaNoLaborable> listar(LocalDate fecha) {
        return repository.findByFecha(fecha);
    }

    private DiaNoLaborable upsert(AlcanceDiaNoLaborable alcance, Long refId,
                                  DeclararDiaNoLaborableRequest request, Long creadoPor) {
        DiaNoLaborable dia = (alcance == AlcanceDiaNoLaborable.GLOBAL
                ? repository.findFirstByAlcanceAndRefIdIsNullAndFecha(AlcanceDiaNoLaborable.GLOBAL, request.getFecha())
                : repository.findFirstByAlcanceAndRefIdAndFecha(AlcanceDiaNoLaborable.EMPLEADO, refId, request.getFecha()))
                .orElseGet(() -> DiaNoLaborable.builder()
                        .alcance(alcance).refId(refId).fecha(request.getFecha()).build());
        dia.setLaborable(request.isLaborable());
        dia.setTipo(request.getTipo());
        dia.setMotivo(request.getMotivo());
        dia.setCreadoPor(creadoPor);
        return repository.save(dia);
    }
}
