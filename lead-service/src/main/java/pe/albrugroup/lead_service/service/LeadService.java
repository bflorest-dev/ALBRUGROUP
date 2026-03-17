package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final CampanaRepository campanaRepository;
    private final EventoService eventoService;

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

    private Campana obtenerCampanaActiva(Long idCampana) {
        return campanaRepository.findByIdAndActivoTrue(idCampana)
                .orElseThrow(() -> new NotFoundException(Campana.class, idCampana));
    }

    private String construirLeadCompleto(LeadIntakeRequest request) {
        return request.getPrefijo().trim() + request.getLead().trim();
    }
}
