package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.LeadAsesorDetalleResponse;
import pe.albrugroup.lead_service.entity.response.LeadAsesorVentasResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final CampanaRepository campanaRepository;
    private final EventoRepository eventoRepository;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    public List<LeadGtrResponse> listarBandejaGtr(LocalDate fecha) {
        LocalDate fechaTrabajo = fecha == null ? LocalDate.now(ZoneId.systemDefault()) : fecha;
        Instant inicioDia = fechaTrabajo.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant finDia = fechaTrabajo.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();

        return leadRepository.listarBandejaGtr(
                Etapa.PREVENTA,
                Accion.ASIGNACION,
                inicioDia,
                finDia
        );
    }

    public List<LeadAsesorVentasResponse> listarBandejaAsesorVentas() {
        Long idAsesor = currentUser.empleadoID();
        List<Lead> leads = leadRepository.listarPendientesAsesorVentas(
                idAsesor,
                Etapa.PREVENTA,
                List.of(EstadoSeguimiento.ASIGNADO, EstadoSeguimiento.EN_GESTION)
        );
        Map<Long, Instant> fechasAsignacion = obtenerFechasAsignacion(leads);

        return leads.stream()
                .map(lead -> toAsesorResponse(lead, fechasAsignacion.get(lead.getId())))
                .toList();
    }

    public LeadAsesorDetalleResponse obtenerDetalleAsesor(Long idLead) {
        Long idAsesor = currentUser.empleadoID();
        Lead lead = leadRepository.buscarDetalleAsesor(idLead, idAsesor)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        Instant fechaAsignacion = eventoRepository.findTopByIdLeadAndAccionOrderByCreatedAtDesc(idLead, Accion.ASIGNACION)
                .map(Evento::getCreatedAt)
                .orElse(null);

        return toAsesorDetalleResponse(lead, fechaAsignacion);
    }

    @Transactional
    public void registrarIngresoLead(LeadIntakeRequest request) {
        String leadCompleto = construirLeadCompleto(request);
        Campana campana = obtenerCampanaActiva(request.getIdCampana());

        leadRepository.findByLead(leadCompleto)
                .ifPresentOrElse(
                        lead -> registrarIngresoLeadExistente(lead, request, campana),
                        () -> registrarLeadNuevo(leadCompleto, request, campana)
                );
    }

    @Transactional
    public void asignarLead(Long idLead, LeadAsignacionRequest request) {
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        lead.setIdAsesorAsignado(request.getIdAsesorAsignado());
        lead.setNombreAsesorAsignado(request.getNombreAsesorAsignado().trim());
        lead.setEstado(EstadoSeguimiento.ASIGNADO);

        Lead savedLead = leadRepository.save(lead);
        Long idCampana = savedLead.getCampana() == null ? null : savedLead.getCampana().getId();
        registrarEventoAsignacion(savedLead.getId(), idCampana, savedLead.getEtapa());
    }

    private void registrarLeadNuevo(String leadCompleto, LeadIntakeRequest request, Campana campana) {
        Lead lead = Lead.builder()
                .lead(leadCompleto)
                .campana(campana)
                .base(request.getBase())
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .lastEntryAt(Instant.now())
                .build();

        Lead savedLead = leadRepository.save(lead);
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa());
    }

    private void registrarIngresoLeadExistente(Lead lead, LeadIntakeRequest request, Campana campana) {
        lead.setCampana(campana);
        lead.setBase(request.getBase());
        lead.setLastEntryAt(Instant.now());

        if (lead.getEtapa() == Etapa.PREVENTA) {
            lead.setIdAsesorAsignado(null);
            lead.setNombreAsesorAsignado(null);
            lead.setIdTipificacion(null);
            lead.setCodigoTipificacion(null);
            lead.setIdSubtipificacion(null);
            lead.setCodigoSubtipificacion(null);
            lead.setEstado(EstadoSeguimiento.NUEVO);
        }

        Lead savedLead = leadRepository.save(lead);
        registrarEventoRegistro(savedLead.getId(), campana.getId(), savedLead.getEtapa());
    }

    private void registrarEventoRegistro(Long idLead, Long idCampana, Etapa etapa) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.REGISTRO)
                        .etapa(etapa)
                        .build()
        );
    }

    private void registrarEventoAsignacion(Long idLead, Long idCampana, Etapa etapa) {
        eventoService.registrarEvento(
                RegistrarEventoRequest.builder()
                        .idLead(idLead)
                        .idCampana(idCampana)
                        .accion(Accion.ASIGNACION)
                        .etapa(etapa)
                        .build()
        );
    }

    private Campana obtenerCampanaActiva(Long idCampana) {
        return campanaRepository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private String construirLeadCompleto(LeadIntakeRequest request) {
        return request.getPrefijo().trim() + request.getLead().trim();
    }

    private Map<Long, Instant> obtenerFechasAsignacion(List<Lead> leads) {
        if (leads.isEmpty()) {
            return Map.of();
        }

        List<Long> leadIds = leads.stream().map(Lead::getId).toList();
        Map<Long, Instant> fechas = new HashMap<>();
        for (Object[] row : eventoRepository.listarUltimaFechaPorLeadIdsYAccion(leadIds, Accion.ASIGNACION)) {
            fechas.put((Long) row[0], (Instant) row[1]);
        }
        return fechas;
    }

    private LeadAsesorVentasResponse toAsesorResponse(Lead lead, Instant fechaAsignacion) {
        SplitLead splitLead = splitLead(lead.getLead());
        DatosPreventa datosPreventa = lead.getDatosPreventa();

        return new LeadAsesorVentasResponse(
                lead.getId(),
                fechaAsignacion,
                splitLead.prefijo(),
                splitLead.numero(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getCorreo(),
                lead.getEstado()
        );
    }

    private LeadAsesorDetalleResponse toAsesorDetalleResponse(Lead lead, Instant fechaAsignacion) {
        SplitLead splitLead = splitLead(lead.getLead());
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion();

        return new LeadAsesorDetalleResponse(
                lead.getId(),
                fechaAsignacion,
                lead.getLastEntryAt(),
                splitLead.prefijo(),
                splitLead.numero(),
                lead.getCampana() == null ? null : lead.getCampana().getNombre(),
                lead.getCampana() == null || lead.getCampana().getProveedor() == null ? null : lead.getCampana().getProveedor().getNombre(),
                lead.getBase(),
                lead.getEstado(),
                lead.getIdAsesorAsignado(),
                lead.getNombreAsesorAsignado(),
                datosPreventa == null ? null : datosPreventa.getTipoDocumento(),
                datosPreventa == null ? null : datosPreventa.getNumeroDocumentoTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularServicio(),
                datosPreventa == null ? null : datosPreventa.getCelularRegistro(),
                datosPreventa == null ? null : datosPreventa.getCelularReferencia(),
                datosPreventa == null ? null : datosPreventa.getCorreo(),
                datosPreventa == null ? null : datosPreventa.getNumeroDocumentoTitularCelularRegistro(),
                datosPreventa == null ? null : datosPreventa.getNombreTitularCelularRegistro(),
                direccion == null ? null : direccion.getUbigeo(),
                direccion == null ? null : direccion.getTipoDomicilio(),
                direccion == null ? null : direccion.getTipoVia(),
                direccion == null ? null : direccion.getVia(),
                direccion == null ? null : direccion.getDireccion(),
                direccion == null ? null : direccion.getReferencia(),
                direccion == null ? null : direccion.getLatitud(),
                direccion == null ? null : direccion.getLongitud(),
                direccion == null ? null : direccion.getUrbanizacion(),
                direccion == null ? null : direccion.getNumero(),
                direccion == null ? null : direccion.getManzana(),
                direccion == null ? null : direccion.getLote(),
                direccion == null ? null : direccion.getNombreEdificio(),
                direccion == null ? null : direccion.getNombreCondominio(),
                direccion == null ? null : direccion.getPiso(),
                direccion == null ? null : direccion.getInterior()
        );
    }

    private SplitLead splitLead(String leadCompleto) {
        if (leadCompleto == null || leadCompleto.isBlank()) {
            return new SplitLead("", "");
        }

        String valor = leadCompleto.trim();
        if (!valor.startsWith("+")) {
            return new SplitLead("", valor);
        }

        int i = 1;
        while (i < valor.length() && Character.isDigit(valor.charAt(i)) && i <= 3) {
            i++;
        }
        return new SplitLead(valor.substring(0, i), valor.substring(i));
    }

    private record SplitLead(String prefijo, String numero) {
    }
}
