package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.LeadSeguimiento;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
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
            Set<ComportamientoTipificacion> comportamientos,
            LocalDate fechaProgramacion,
            LocalTime horaProgramada,
            LocalDate fechaRechazo,
            LocalDate fechaInstalacion
    ) {
        LeadSeguimiento seg = obtenerOCrear(idLead);
        Instant ahora = OperationalDateTime.now();

        if (etapaActual == Etapa.PREVENTA
                && comportamientos.contains(ComportamientoTipificacion.APARECE_EN_AGENDADOS_GTR)) {
            seg.setFechaAgendamientoPreventa(ahora);
        }

        if (comportamientos.contains(ComportamientoTipificacion.REGISTRA_CRM)) {
            seg.setFechaRegistroCrm(ahora);
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

        leadSeguimientoRepository.save(seg);
    }

    /**
     * Punto único para cambiar el estado POSTVENTA del cliente. Además de setear el estado en el Lead,
     * sella la fecha automática en LeadSeguimiento cuando pasa a SUSPENDIDO o BAJA. Cualquier transición
     * de estado (cierre de periodo, registro de pago) debe pasar por aquí para no dejar la fecha sin sellar.
     *
     * @param cuando instante del hecho (p. ej. la fechaCierre del periodo); si es null se usa "ahora".
     */
    public void marcarEstadoClientePostventa(Lead lead, EstadoClientePostventa estado, Instant cuando) {
        if (lead == null || estado == null) {
            return;
        }
        lead.setEstadoClientePostventa(estado);
        if (estado != EstadoClientePostventa.SUSPENDIDO && estado != EstadoClientePostventa.BAJA) {
            return;
        }
        LeadSeguimiento seg = obtenerOCrear(lead.getId());
        Instant momento = cuando != null ? cuando : OperationalDateTime.now();
        if (estado == EstadoClientePostventa.SUSPENDIDO) {
            seg.setFechaSuspension(momento);
        } else {
            seg.setFechaBaja(momento);
        }
        leadSeguimientoRepository.save(seg);
    }

    /**
     * Subsanación: el admin recrea un lead histórico indicando su fecha de instalación. Para estos leads,
     * registroCrm = grabación = instalación = esa misma fecha (los dos primeros como Instant a medianoche).
     */
    public void registrarSubsanacion(Long idLead, LocalDate fechaInstalacion) {
        if (idLead == null || fechaInstalacion == null) {
            return;
        }
        LeadSeguimiento seg = obtenerOCrear(idLead);
        Instant instalacionInstant = fechaInstalacion.atStartOfDay(OperationalDateTime.ZONE).toInstant();
        seg.setFechaRegistroCrm(instalacionInstant);
        seg.setFechaGrabacion(instalacionInstant);
        seg.setFechaInstalacion(fechaInstalacion);
        leadSeguimientoRepository.save(seg);
    }

    /**
     * Garantiza la fila de seguimiento desde el alta. Las fechas de negocio permanecen nulas hasta que
     * ocurra la tipificacion que realmente las representa (REGISTRA_CRM, grabacion, programacion, etc.).
     */
    public void registrarAlta(Long idLead) {
        if (idLead == null) {
            return;
        }
        leadSeguimientoRepository.save(obtenerOCrear(idLead));
    }

    private LeadSeguimiento obtenerOCrear(Long idLead) {
        return leadSeguimientoRepository.findByIdLead(idLead)
                .orElseGet(() -> LeadSeguimiento.builder().idLead(idLead).build());
    }
}
