package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.LeadSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadFichaDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadFichaDetalleResponse.ActorMomento;
import pe.albrugroup.lead_service.entity.response.LeadFichaDetalleResponse.CuandoDetalle;
import pe.albrugroup.lead_service.entity.response.LeadFichaDetalleResponse.QuienDetalle;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadSeguimientoRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeadFichaDetalleService {

    private final EventoRepository eventoRepository;
    private final LeadEtapaResumenRepository resumenRepository;
    private final LeadSeguimientoRepository seguimientoRepository;

    public LeadFichaDetalleResponse obtenerFichaDetalle(Long idLead, Etapa etapa) {
        return new LeadFichaDetalleResponse(
                construirQuien(idLead, etapa),
                construirCuando(idLead)
        );
    }

    private QuienDetalle construirQuien(Long idLead, Etapa etapa) {
        var resumen = resumenRepository.findByIdLeadAndEtapa(idLead, etapa).orElse(null);

        ActorMomento primeraAsignacion = eventoRepository
                .findTopByIdLeadAndAccionAndEtapaOrderByCreatedAtAscIdAsc(idLead, Accion.ASIGNACION, etapa)
                .map(e -> asignado(e))
                .orElse(null);

        ActorMomento primeraTipificacion = eventoRepository
                .findTopByIdLeadAndAccionAndEtapaOrderByCreatedAtAscIdAsc(idLead, Accion.TIPIFICACION, etapa)
                .map(e -> actor(e))
                .orElse(null);

        ActorMomento ultimaAsignacion = eventoRepository
                .findTopByIdLeadAndAccionAndEtapaOrderByCreatedAtDescIdDesc(idLead, Accion.ASIGNACION, etapa)
                .map(e -> asignado(e))
                .orElse(null);

        ActorMomento ultimaTipificacion = eventoRepository
                .findTopByIdLeadAndAccionAndEtapaOrderByCreatedAtDescIdDesc(idLead, Accion.TIPIFICACION, etapa)
                .map(e -> actor(e))
                .orElse(null);

        ActorMomento mayorTipificacion = null;
        if (resumen != null && resumen.getMayorRangoAt() != null) {
            mayorTipificacion = eventoRepository
                    .findTopByIdLeadAndAccionAndEtapaAndCreatedAtOrderByIdDesc(
                            idLead, Accion.TIPIFICACION, etapa, resumen.getMayorRangoAt())
                    .map(e -> actor(e))
                    .orElse(null);
        }

        return new QuienDetalle(
                primeraAsignacion,
                primeraTipificacion,
                ultimaAsignacion,
                ultimaTipificacion,
                mayorTipificacion,
                resumen != null ? resumen.getPrimeraCodigoTipificacion() : null,
                resumen != null ? resumen.getUltimaCodigoTipificacion() : null,
                resumen != null ? resumen.getMayorRangoCodigoTipificacion() : null
        );
    }

    private CuandoDetalle construirCuando(Long idLead) {
        Instant primerRegistro = eventoRepository
                .findTopByIdLeadAndAccionOrderByCreatedAtAscIdAsc(idLead, Accion.REGISTRO)
                .map(Evento::getCreatedAt)
                .orElse(null);

        Instant ultimoRegistro = eventoRepository
                .findTopByIdLeadAndAccionOrderByCreatedAtDescIdDesc(idLead, Accion.REGISTRO)
                .map(Evento::getCreatedAt)
                .orElse(null);

        Instant ingresoVenta = resumenRepository
                .findByIdLeadAndEtapa(idLead, Etapa.VENTA)
                .map(LeadEtapaResumen::getFechaIngresoEtapa)
                .orElse(null);

        LocalDate fechaInstalacion = seguimientoRepository
                .findByIdLead(idLead)
                .map(LeadSeguimiento::getFechaInstalacion)
                .orElse(null);

        Instant ultimaGestionPostventa = resumenRepository
                .findByIdLeadAndEtapa(idLead, Etapa.POSTVENTA)
                .map(LeadEtapaResumen::getFechaUltimaGestion)
                .orElse(null);

        return new CuandoDetalle(
                primerRegistro,
                ultimoRegistro,
                ingresoVenta,
                fechaInstalacion,
                ultimaGestionPostventa
        );
    }

    private static ActorMomento asignado(Evento e) {
        return new ActorMomento(e.getIdAsesorAsignado(), e.getNombreAsesorAsignado(), e.getCreatedAt());
    }

    private static ActorMomento actor(Evento e) {
        return new ActorMomento(e.getIdActor(), e.getNombreActor(), e.getCreatedAt());
    }
}
