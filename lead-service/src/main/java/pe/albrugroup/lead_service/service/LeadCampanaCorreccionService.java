package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.request.LeadCampanaCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.LeadCampanaCorreccionCandidatoResponse;
import pe.albrugroup.lead_service.entity.response.LeadCampanaCorreccionResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class LeadCampanaCorreccionService {

    private final LeadRepository leadRepository;
    private final CampanaRepository campanaRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final EventoRepository eventoRepository;
    private final LeadRealtimeNotifier leadRealtimeNotifier;

    @Transactional(readOnly = true)
    public List<LeadCampanaCorreccionCandidatoResponse> buscarPorLead(String lead) {
        String normalized = normalizeLead(lead);
        return leadRepository.buscarCorreccionCampanaPorLead(normalized).stream()
                .map(this::toCandidatoResponse)
                .toList();
    }

    public LeadCampanaCorreccionResponse corregirCampana(Long idLead, LeadCampanaCorreccionRequest request) {
        Lead lead = leadRepository.buscarParaCorreccionCampana(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        Campana campanaAnterior = lead.getCampana();
        Long idEquipoAnterior = lead.getIdEquipo();
        Campana campanaNueva = obtenerCampanaNueva(request);
        Long idEquipoNuevo = derivarIdEquipo(campanaNueva);

        lead.setCampana(campanaNueva);
        lead.setIdEquipo(idEquipoNuevo);
        lead.setUpdatedAt(OperationalDateTime.now());

        Lead savedLead = leadRepository.save(lead);
        int eventosActualizados = eventoRepository.actualizarCampanaPorLead(
                idLead,
                campanaNueva == null ? null : campanaNueva.getId()
        );

        LeadCampanaCorreccionResponse response = LeadCampanaCorreccionResponse.builder()
                .idLead(savedLead.getId())
                .lead(savedLead.getLead())
                .idCampanaAnterior(campanaAnterior == null ? null : campanaAnterior.getId())
                .nombreCampanaAnterior(campanaAnterior == null ? null : campanaAnterior.getNombre())
                .idCampanaNueva(campanaNueva == null ? null : campanaNueva.getId())
                .nombreCampanaNueva(campanaNueva == null ? null : campanaNueva.getNombre())
                .idEquipoAnterior(idEquipoAnterior)
                .idEquipoNuevo(idEquipoNuevo)
                .eventosActualizados(eventosActualizados)
                .build();

        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("CAMPANA_CORREGIDA")
                .idLead(savedLead.getId())
                .etapa(savedLead.getEtapa())
                .estado(savedLead.getEstado())
                .estadoPostventa(savedLead.getEstadoPostventa())
                .idAsesorAsignado(savedLead.getIdAsesorAsignado())
                .codigoTipificacion(savedLead.getCodigoTipificacion())
                .codigoSubtipificacion(savedLead.getCodigoSubtipificacion())
                .idCampanaAnterior(response.getIdCampanaAnterior())
                .idCampanaNueva(response.getIdCampanaNueva())
                .nombreCampanaAnterior(response.getNombreCampanaAnterior())
                .nombreCampanaNueva(response.getNombreCampanaNueva())
                .eventosActualizados(eventosActualizados)
                .occurredAt(OperationalDateTime.now())
                .tambienBandejaGtr(savedLead.isRequiereAtencionGtr())
                .build());

        return response;
    }

    private Campana obtenerCampanaNueva(LeadCampanaCorreccionRequest request) {
        if (request == null || request.getIdCampana() == null) {
            return null;
        }
        return campanaRepository.findByIdAndActivoTrue(request.getIdCampana())
                .orElseThrow(() -> new BadRequestException("La campana seleccionada no esta activa o no existe"));
    }

    private Long derivarIdEquipo(Campana campana) {
        if (campana == null || campana.getProveedor() == null || campana.getProveedor().getId() == null) {
            return null;
        }
        return equipoProveedorRepository.findFirstByProveedorId(campana.getProveedor().getId())
                .map(EquipoProveedor::getIdEquipo)
                .orElse(null);
    }

    private LeadCampanaCorreccionCandidatoResponse toCandidatoResponse(Lead lead) {
        Campana campana = lead.getCampana();
        return LeadCampanaCorreccionCandidatoResponse.builder()
                .idLead(lead.getId())
                .prefijo(lead.getPrefijo())
                .lead(lead.getLead())
                .etapa(lead.getEtapa())
                .estado(lead.getEstado())
                .idCampanaActual(campana == null ? null : campana.getId())
                .nombreCampanaActual(campana == null ? null : campana.getNombre())
                .idEquipo(lead.getIdEquipo())
                .nombreAsesorAsignado(lead.getNombreAsesorAsignado())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .cantidadEventos(eventoRepository.countByIdLead(lead.getId()))
                .build();
    }

    private String normalizeLead(String lead) {
        if (lead == null || lead.isBlank()) {
            throw new BadRequestException("Ingresa un numero de lead para buscar.");
        }
        String normalized = lead.replaceAll("\\s+", "");
        if (normalized.isBlank()) {
            throw new BadRequestException("Ingresa un numero de lead para buscar.");
        }
        return normalized;
    }
}
