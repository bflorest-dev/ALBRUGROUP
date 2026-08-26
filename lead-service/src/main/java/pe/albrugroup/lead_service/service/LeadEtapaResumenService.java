package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;

import java.time.Instant;
import java.util.List;

/**
 * Escritura de la metadata historica por etapa ({@link LeadEtapaResumen}).
 *
 * Todos los metodos son idempotentes por (idLead, etapa) y se invocan desde los flujos de
 * LeadService (registro/asignacion/tipificacion/avance) dentro de la misma transaccion. No cambian
 * el estado operativo del Lead; solo mantienen los puntos historicos por etapa.
 */
@Service
@RequiredArgsConstructor
public class LeadEtapaResumenService {

    private final LeadEtapaResumenRepository repository;

    /** Al ENTRAR a una etapa: crea la fila (o la reabre si el lead reingresa). */
    public void registrarEntradaEtapa(Long idLead, Etapa etapa, Instant at) {
        repository.findByIdLeadAndEtapa(idLead, etapa).ifPresentOrElse(
                resumen -> {
                    // Reingreso: reabrimos la etapa (last-writer-wins, sin versionar) y contamos la pasada.
                    resumen.setFechaSalidaEtapa(null);
                    resumen.setNumeroPasadas(nvl(resumen.getNumeroPasadas(), 1) + 1);
                    if (resumen.getFechaIngresoEtapa() == null) {
                        resumen.setFechaIngresoEtapa(at);
                    }
                    repository.save(resumen);
                },
                () -> repository.save(LeadEtapaResumen.builder()
                        .idLead(idLead)
                        .etapa(etapa)
                        .fechaIngresoEtapa(at)
                        .build())
        );
    }

    /** Al SALIR de una etapa (avance): marca la fecha de salida. */
    public void registrarSalidaEtapa(Long idLead, Etapa etapa, Instant at) {
        repository.findByIdLeadAndEtapa(idLead, etapa).ifPresent(resumen -> {
            resumen.setFechaSalidaEtapa(at);
            repository.save(resumen);
        });
    }

    /** Cada tipificacion de la etapa: primera (set-once), ultima, mayor rango, contador y ultimo gestor. */
    public void registrarTipificacion(
            Long idLead,
            Etapa etapa,
            String codigoTipificacion,
            String codigoSubtipificacion,
            Integer orden,
            Long idAsesorGestion,
            String nombreAsesorGestion,
            Instant at
    ) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);

        // Primera tipificacion de la etapa: solo la primera vez.
        if (resumen.getPrimeraCodigoTipificacion() == null) {
            resumen.setPrimeraCodigoTipificacion(codigoTipificacion);
            resumen.setPrimeraCodigoSubtipificacion(codigoSubtipificacion);
            resumen.setPrimeraTipificacionOrden(orden);
            resumen.setPrimeraTipificacionAt(at);
        }

        // Ultima tipificacion: se pisa siempre.
        resumen.setUltimaCodigoTipificacion(codigoTipificacion);
        resumen.setUltimaCodigoSubtipificacion(codigoSubtipificacion);
        resumen.setUltimaTipificacionOrden(orden);
        resumen.setUltimaTipificacionAt(at);

        // Mayor rango (high-water mark por orden): la tipi solo sube; en empate refresca la subtipi.
        if (orden != null) {
            Integer maxOrden = resumen.getMayorRangoOrden();
            if (maxOrden == null || orden > maxOrden) {
                resumen.setMayorRangoCodigoTipificacion(codigoTipificacion);
                resumen.setMayorRangoCodigoSubtipificacion(codigoSubtipificacion);
                resumen.setMayorRangoOrden(orden);
                resumen.setMayorRangoAt(at);
            } else if (orden.equals(maxOrden)) {
                resumen.setMayorRangoCodigoSubtipificacion(codigoSubtipificacion);
                resumen.setMayorRangoAt(at);
            }
        }

        resumen.setTotalTipificaciones(nvl(resumen.getTotalTipificaciones(), 0) + 1);
        resumen.setIdAsesorUltimaGestion(idAsesorGestion);
        resumen.setNombreAsesorUltimaGestion(nombreAsesorGestion);
        resumen.setFechaUltimaGestion(at);

        repository.save(resumen);
    }

    /** Retorno desde VENTA: descarta la preventa previa como venta no aprobada y reabre gestion. */
    public void registrarRetornoVentaPreventa(
            Long idLead,
            Etapa etapa,
            String codigoTipificacion,
            String codigoSubtipificacion,
            Integer orden,
            Long idAsesorGestion,
            String nombreAsesorGestion,
            Instant at
    ) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);

        if (resumen.getPrimeraCodigoTipificacion() == null) {
            resumen.setPrimeraCodigoTipificacion(codigoTipificacion);
            resumen.setPrimeraCodigoSubtipificacion(codigoSubtipificacion);
            resumen.setPrimeraTipificacionOrden(orden);
            resumen.setPrimeraTipificacionAt(at);
        }

        resumen.setUltimaCodigoTipificacion(codigoTipificacion);
        resumen.setUltimaCodigoSubtipificacion(codigoSubtipificacion);
        resumen.setUltimaTipificacionOrden(orden);
        resumen.setUltimaTipificacionAt(at);

        resumen.setMayorRangoCodigoTipificacion(codigoTipificacion);
        resumen.setMayorRangoCodigoSubtipificacion(codigoSubtipificacion);
        resumen.setMayorRangoOrden(orden);
        resumen.setMayorRangoAt(at);

        resumen.setFechaMerito(null);
        resumen.setTotalTipificaciones(nvl(resumen.getTotalTipificaciones(), 0) + 1);
        resumen.setIdAsesorUltimaGestion(idAsesorGestion);
        resumen.setNombreAsesorUltimaGestion(nombreAsesorGestion);
        resumen.setFechaUltimaGestion(at);

        repository.save(resumen);
    }

    /** Cada asignacion de la etapa: incrementa el contador. */
    public void registrarAsignacion(Long idLead, Etapa etapa, Instant at) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);
        resumen.setTotalAsignaciones(nvl(resumen.getTotalAsignaciones(), 0) + 1);
        repository.save(resumen);
    }

    /** Merito de la etapa: compatibilidad para asignar asesor y fecha en bloque. */
    public void registrarMerito(Long idLead, Etapa etapa, Long idAsesorMerito, String nombreAsesorMerito, Instant at) {
        asignarAsesorMerito(idLead, etapa, idAsesorMerito, nombreAsesorMerito, at);
        asignarFechaMerito(idLead, etapa, at);
    }

    /** Asigna solo asesor de merito, sin tocar fechaMerito. */
    public void asignarAsesorMerito(Long idLead, Etapa etapa, Long idAsesorMerito, String nombreAsesorMerito, Instant at) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);
        resumen.setIdAsesorMerito(idAsesorMerito);
        resumen.setNombreAsesorMerito(nombreAsesorMerito);
        repository.save(resumen);
    }

    /** Asigna solo fechaMerito, sin tocar asesor de merito. */
    public void asignarFechaMerito(Long idLead, Etapa etapa, Instant at) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);
        resumen.setFechaMerito(at);
        repository.save(resumen);
    }

    /** Limpia solo asesor de merito, sin tocar fechaMerito. */
    public void anularAsesorMerito(Long idLead, Etapa etapa, Instant at) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);
        resumen.setIdAsesorMerito(null);
        resumen.setNombreAsesorMerito(null);
        repository.save(resumen);
    }

    /** Limpia solo fechaMerito, sin tocar asesor de merito. */
    public void anularFechaMerito(Long idLead, Etapa etapa, Instant at) {
        LeadEtapaResumen resumen = obtenerOCrear(idLead, etapa, at);
        resumen.setFechaMerito(null);
        repository.save(resumen);
    }

    /** Limpia asesor de merito en todas las etapas anteriores a la etapa tipificada. */
    public void anularAsesorMeritoEtapasAnteriores(Long idLead, Etapa etapaActual) {
        for (Etapa etapaAnterior : etapasAnteriores(etapaActual)) {
            repository.findByIdLeadAndEtapa(idLead, etapaAnterior).ifPresent(resumen -> {
                resumen.setIdAsesorMerito(null);
                resumen.setNombreAsesorMerito(null);
                repository.save(resumen);
            });
        }
    }

    /** Limpia fechaMerito en todas las etapas anteriores a la etapa tipificada. */
    public void anularFechaMeritoEtapasAnteriores(Long idLead, Etapa etapaActual) {
        for (Etapa etapaAnterior : etapasAnteriores(etapaActual)) {
            repository.findByIdLeadAndEtapa(idLead, etapaAnterior).ifPresent(resumen -> {
                resumen.setFechaMerito(null);
                repository.save(resumen);
            });
        }
    }

    /** ¿El asesor es el merito (quien concreto) de la etapa del lead? Autorizacion read-only. */
    public boolean esAsesorMeritoEtapa(Long idLead, Etapa etapa, Long idAsesor) {
        if (idAsesor == null) {
            return false;
        }
        return repository.findByIdLeadAndEtapa(idLead, etapa)
                .map(resumen -> idAsesor.equals(resumen.getIdAsesorMerito()))
                .orElse(false);
    }

    private LeadEtapaResumen obtenerOCrear(Long idLead, Etapa etapa, Instant at) {
        return repository.findByIdLeadAndEtapa(idLead, etapa)
                .orElseGet(() -> LeadEtapaResumen.builder()
                        .idLead(idLead)
                        .etapa(etapa)
                        .fechaIngresoEtapa(at)
                        .build());
    }

    private static int nvl(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private static List<Etapa> etapasAnteriores(Etapa etapaActual) {
        return switch (etapaActual) {
            case PREVENTA -> List.of();
            case VENTA -> List.of(Etapa.PREVENTA);
            case POSTVENTA -> List.of(Etapa.PREVENTA, Etapa.VENTA);
            case COBRANZA -> List.of(Etapa.PREVENTA, Etapa.VENTA, Etapa.POSTVENTA);
        };
    }
}
