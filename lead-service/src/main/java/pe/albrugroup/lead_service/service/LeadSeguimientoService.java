package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.LeadSeguimiento;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.LeadSeguimientoRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeadSeguimientoService {

    private final LeadSeguimientoRepository leadSeguimientoRepository;

    public void actualizarPorTipificacion(
            Long idLead,
            Etapa etapaActual,
            Etapa etapaDestino,
            Set<ComportamientoTipificacion> comportamientos,
            LocalDate fechaProgramacion,
            LocalTime horaProgramada,
            LocalDate fechaRechazo,
            LocalDate fechaInstalacion
    ) {
        LeadSeguimiento seg = obtenerOCrear(idLead);
        Instant ahora = OperationalDateTime.now();
        boolean cambiaEtapa = etapaDestino != null && etapaDestino != etapaActual;

        if (etapaActual == Etapa.PREVENTA
                && comportamientos.contains(ComportamientoTipificacion.APARECE_EN_AGENDADOS_GTR)) {
            seg.setFechaAgendamientoPreventa(ahora);
        }

        if (comportamientos.contains(ComportamientoTipificacion.REGISTRA_INGRESO_VENTA)) {
            seg.setFechaIngresoVenta(ahora);
        }

        if (etapaActual == Etapa.VENTA
                && comportamientos.contains(ComportamientoTipificacion.ES_GRABACION)) {
            seg.setFechaGrabacion(ahora);
        }

        if (fechaProgramacion != null) {
            LocalTime hora = horaProgramada != null ? horaProgramada : LocalTime.MIDNIGHT;
            seg.setFechaProgramacion(
                    fechaProgramacion.atTime(hora).atZone(OperationalDateTime.ZONE).toInstant());
        }
        if (fechaRechazo != null) {
            seg.setFechaRechazo(fechaRechazo);
        }
        if (fechaInstalacion != null) {
            seg.setFechaInstalacion(fechaInstalacion);
        }

        if (cambiaEtapa && etapaDestino == Etapa.POSTVENTA) {
            seg.setFechaIngresoPostventa(ahora);
        }

        leadSeguimientoRepository.save(seg);
    }

    private LeadSeguimiento obtenerOCrear(Long idLead) {
        return leadSeguimientoRepository.findByIdLead(idLead)
                .orElseGet(() -> LeadSeguimiento.builder().idLead(idLead).build());
    }
}
