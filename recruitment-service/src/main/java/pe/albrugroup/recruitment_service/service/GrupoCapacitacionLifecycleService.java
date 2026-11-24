package pe.albrugroup.recruitment_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.recruitment_service.entity.GrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.repository.GrupoCapacitacionRepository;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GrupoCapacitacionLifecycleService {

    public static final ZoneId LIMA_ZONE = ZoneId.of("America/Lima");

    private final GrupoCapacitacionRepository grupoCapacitacionRepository;

    @Transactional
    public void sincronizarEstados() {
        LocalDate hoy = LocalDate.now(LIMA_ZONE);

        List<GrupoCapacitacion> vencidos = grupoCapacitacionRepository
                .findByEstadoInAndFechaFinBefore(
                        EnumSet.of(EstadoGrupoCapacitacion.ABIERTO, EstadoGrupoCapacitacion.EN_CURSO),
                        hoy
                );
        vencidos.forEach(grupo -> grupo.setEstado(EstadoGrupoCapacitacion.CERRADO));

        List<GrupoCapacitacion> iniciados = grupoCapacitacionRepository
                .findByEstadoAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqual(
                        EstadoGrupoCapacitacion.ABIERTO, hoy, hoy
                );
        iniciados.forEach(grupo -> grupo.setEstado(EstadoGrupoCapacitacion.EN_CURSO));

        if (!vencidos.isEmpty() || !iniciados.isEmpty()) {
            grupoCapacitacionRepository.saveAll(vencidos);
            grupoCapacitacionRepository.saveAll(iniciados);
        }
    }

    @Transactional
    @Scheduled(cron = "0 0 0 * * *", zone = "America/Lima")
    public void sincronizarEstadosDiariamente() {
        sincronizarEstados();
    }
}
