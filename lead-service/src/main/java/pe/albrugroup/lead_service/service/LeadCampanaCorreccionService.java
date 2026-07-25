package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.request.LeadCampanaCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.LeadCampanaCorreccionCandidatoResponse;
import pe.albrugroup.lead_service.entity.response.LeadCampanaCorreccionResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
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

    @Transactional(readOnly = true)
    public List<CampanaResponse> listarCampanasCompatibles(Long idLead) {
        Lead lead = leadRepository.buscarParaCorreccionCampana(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (lead.getIdEquipo() == null) {
            return List.of();
        }
        return campanaRepository.listarActivasPorEquipo(lead.getIdEquipo()).stream()
                .map(this::toCampanaResponse)
                .toList();
    }

    public LeadCampanaCorreccionResponse corregirCampana(Long idLead, LeadCampanaCorreccionRequest request) {
        Lead lead = leadRepository.buscarParaCorreccionCampana(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));

        Campana campanaAnterior = lead.getCampana();
        Long idEquipoAnterior = lead.getIdEquipo();
        Campana campanaNueva = obtenerCampanaNueva(request, lead.getIdEquipo());

        lead.setCampana(campanaNueva);
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
                .idEquipoNuevo(savedLead.getIdEquipo())
                .eventosActualizados(eventosActualizados)
                .build();

        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("CAMPANA_CORREGIDA")
                .idLead(savedLead.getId())
                .etapa(savedLead.getEtapa())
                .estado(savedLead.getEstado())
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

    private Campana obtenerCampanaNueva(LeadCampanaCorreccionRequest request, Long idEquipoLead) {
        if (request == null || request.getIdCampana() == null) {
            return null;
        }
        if (idEquipoLead == null) {
            throw new BadRequestException("Este lead no tiene equipo asignado. Solo puede dejarse sin campana.");
        }
        return campanaRepository.findByIdAndActivoTrue(request.getIdCampana())
                .map(campana -> validarCampanaPerteneceAlEquipo(campana, idEquipoLead))
                .orElseThrow(() -> new BadRequestException("La campana seleccionada no esta activa o no existe"));
    }

    private Campana validarCampanaPerteneceAlEquipo(Campana campana, Long idEquipoLead) {
        Long idProveedor = campana.getProveedor() == null ? null : campana.getProveedor().getId();
        if (idProveedor == null || !equipoProveedorRepository.existsByIdEquipoAndProveedorId(idEquipoLead, idProveedor)) {
            throw new BadRequestException("La campana seleccionada no pertenece al equipo de este lead.");
        }
        return campana;
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

    private CampanaResponse toCampanaResponse(Campana campana) {
        return CampanaResponse.builder()
                .id(campana.getId())
                .nombre(campana.getNombre())
                .prefijo(campana.getPrefijo())
                .numeroWhatsappEmpresa(campana.getNumeroWhatsApp())
                .activo(campana.getActivo())
                .idCuentaPublicitaria(campana.getCuentaPublicitaria() == null ? null : campana.getCuentaPublicitaria().getId())
                .numeroCuenta(campana.getCuentaPublicitaria() == null ? null : campana.getCuentaPublicitaria().getNumeroCuenta())
                .nombreCuenta(campana.getCuentaPublicitaria() == null ? null : campana.getCuentaPublicitaria().getNombreCuenta())
                .idProveedor(campana.getProveedor() == null ? null : campana.getProveedor().getId())
                .nombreProveedor(campana.getProveedor() == null ? null : campana.getProveedor().getNombre())
                .createdAt(campana.getCreatedAt())
                .updatedAt(campana.getUpdatedAt())
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
