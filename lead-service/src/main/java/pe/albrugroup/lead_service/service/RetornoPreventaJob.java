package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.configuration.RetornoPreventaProperties;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RetornoPreventaJob {

    private final RetornoPreventaProperties config;
    private final LeadRepository leadRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionRepository tipificacionRepository;
    private final EventoRepository eventoRepository;
    private final ProveedorRepository proveedorRepository;
    private final LeadEtapaResumenService leadEtapaResumenService;
    private final LeadRealtimeNotifier leadRealtimeNotifier;
    private final TransactionTemplate txTemplate;

    @Scheduled(cron = "0 0 * * * *")
    public void ejecutar() {
        List<Long> subtipiIds = subtipificacionRepository.findIdsByComportamiento(
                ComportamientoTipificacion.RETORNO_PREVENTA_POR_CONTACTO);
        if (subtipiIds.isEmpty()) {
            return;
        }

        Instant ahora = OperationalDateTime.now();
        Instant sinCambioDesde = ahora.minus(Duration.ofDays(config.getDiasSinCambio()));
        Instant contactoDesde = ahora.minus(Duration.ofDays(config.getDiasContactoReciente()));

        List<Long> leadIds = leadRepository.findLeadIdsParaRetornoPreventa(
                Etapa.VENTA, subtipiIds, sinCambioDesde, contactoDesde, Accion.CONTACTO);

        if (leadIds.isEmpty()) {
            return;
        }

        log.info("Retorno PREVENTA: {} leads candidatos en VENTA", leadIds.size());
        int procesados = 0;
        int errores = 0;

        for (Long idLead : leadIds) {
            try {
                txTemplate.executeWithoutResult(status -> retornarAPreventa(idLead, ahora));
                procesados++;
            } catch (Exception e) {
                errores++;
                log.warn("Retorno PREVENTA: error procesando lead {}: {}", idLead, e.getMessage());
            }
        }

        log.info("Retorno PREVENTA: {} procesados, {} errores", procesados, errores);
    }

    private void retornarAPreventa(Long idLead, Instant ahora) {
        Lead lead = leadRepository.findById(idLead).orElse(null);
        if (lead == null || lead.getEtapa() != Etapa.VENTA) {
            return;
        }

        Long idProveedor = resolverIdProveedor(lead);
        if (idProveedor == null) {
            log.warn("Retorno PREVENTA: lead {} sin proveedor resolvible, omitido", idLead);
            return;
        }

        Tipificacion tipiDestino = tipificacionRepository
                .findByMatrizEtapaAndMatrizProveedorIdAndCodigoAndActivoTrue(
                        Etapa.PREVENTA, idProveedor, config.getCodigoTipificacion())
                .orElse(null);
        if (tipiDestino == null) {
            log.warn("Retorno PREVENTA: tipi '{}' no encontrada en PREVENTA para proveedor {}, lead {} omitido",
                    config.getCodigoTipificacion(), idProveedor, idLead);
            return;
        }

        Subtipificacion subtipiDestino = subtipificacionRepository
                .findByTipificacionIdAndCodigoAndActivoTrue(tipiDestino.getId(), config.getCodigoSubtipificacion())
                .orElse(null);
        if (subtipiDestino == null) {
            log.warn("Retorno PREVENTA: subtipi '{}' no encontrada bajo '{}' para proveedor {}, lead {} omitido",
                    config.getCodigoSubtipificacion(), config.getCodigoTipificacion(), idProveedor, idLead);
            return;
        }

        String tipiAnterior = lead.getCodigoTipificacion();
        String subtipiAnterior = lead.getCodigoSubtipificacion();

        lead.setEtapa(Etapa.PREVENTA);
        lead.setLastEntryAt(ahora);
        lead.setEstado(EstadoSeguimiento.NUEVO);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setIdTipificacion(tipiDestino.getId());
        lead.setCodigoTipificacion(tipiDestino.getCodigo());
        lead.setIdSubtipificacion(subtipiDestino.getId());
        lead.setCodigoSubtipificacion(subtipiDestino.getCodigo());
        lead.setEsDerivado(false);
        leadRepository.save(lead);

        leadEtapaResumenService.registrarSalidaEtapa(lead.getId(), Etapa.VENTA, ahora);
        leadEtapaResumenService.registrarEntradaEtapa(lead.getId(), Etapa.PREVENTA, ahora);
        leadEtapaResumenService.registrarTipificacionResultadoEtapa(
                lead.getId(), Etapa.PREVENTA,
                tipiDestino.getCodigo(), subtipiDestino.getCodigo(), tipiDestino.getOrden(),
                null, null, ahora);

        eventoRepository.save(Evento.builder()
                .idLead(lead.getId())
                .idCampana(lead.getCampana() == null ? null : lead.getCampana().getId())
                .nombreActor("SISTEMA")
                .rolActor("SISTEMA")
                .accion(Accion.TIPIFICACION)
                .etapa(Etapa.VENTA)
                .tipificacion(tipiAnterior)
                .subtipificacion(subtipiAnterior)
                .idTipificacionResultado(tipiDestino.getId())
                .idSubtipificacionResultado(subtipiDestino.getId())
                .tipificacionResultado(tipiDestino.getCodigo())
                .subtipificacionResultado(subtipiDestino.getCodigo())
                .comentario("Retorno automático: sin avance en VENTA por " + config.getDiasSinCambio() + "+ días con contacto reciente")
                .build());

        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("RETORNO_PREVENTA")
                .idLead(lead.getId())
                .etapa(Etapa.PREVENTA)
                .etapaAnterior(Etapa.VENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .codigoTipificacion(tipiDestino.getCodigo())
                .codigoSubtipificacion(subtipiDestino.getCodigo())
                .occurredAt(ahora)
                .build());

        log.debug("Retorno PREVENTA: lead {} devuelto ({}/{} → {}/{})",
                lead.getId(), tipiAnterior, subtipiAnterior,
                tipiDestino.getCodigo(), subtipiDestino.getCodigo());
    }

    private Long resolverIdProveedor(Lead lead) {
        if (lead.getPlan() != null && lead.getPlan().getProveedor() != null) {
            return lead.getPlan().getProveedor().getId();
        }
        String snapshot = lead.getNombreProveedorSnapshot();
        if (snapshot != null && !snapshot.isBlank()) {
            return proveedorRepository.findFirstByNombreIgnoreCase(snapshot.trim())
                    .map(p -> p.getId())
                    .orElse(null);
        }
        return null;
    }
}
