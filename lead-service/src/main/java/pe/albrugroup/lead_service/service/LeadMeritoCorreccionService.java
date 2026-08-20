package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.LeadMeritoCorreccion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadMeritoCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.LeadMeritoCorreccionCandidatoResponse;
import pe.albrugroup.lead_service.entity.response.LeadMeritoCorreccionResponse;
import pe.albrugroup.lead_service.entity.response.UsuarioRolAuthResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadMeritoCorreccionRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
@RequiredArgsConstructor
public class LeadMeritoCorreccionService {

    private static final Etapa ETAPA_MERITO = Etapa.PREVENTA;

    private final LeadRepository leadRepository;
    private final LeadEtapaResumenRepository leadEtapaResumenRepository;
    private final LeadMeritoCorreccionRepository correccionRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final AuthEquipoClient authEquipoClient;
    private final CurrentUser currentUser;

    @Transactional(readOnly = true)
    public List<LeadMeritoCorreccionCandidatoResponse> buscar(String buscar) {
        BusquedaMeritoFiltro busqueda = resolverBusquedaVenta(buscar);
        if (!busqueda.buscando()) {
            throw new BadRequestException("El lead, documento o usermeta es obligatorio");
        }

        List<Lead> leads = busqueda.buscarPorUsermeta()
                ? leadRepository.buscarPorUsermeta(busqueda.valor())
                : leadRepository.buscarPorLeadODocumento(busqueda.valor());

        return leads.stream()
                .map(this::toCandidatoResponse)
                .toList();
    }

    public LeadMeritoCorreccionResponse corregirMerito(Long idLead, LeadMeritoCorreccionRequest request) {
        if (request == null) {
            throw new BadRequestException("El asesor de merito es obligatorio");
        }

        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        LeadEtapaResumen resumenPreventa = obtenerResumenPreventaValido(lead);

        if (correccionRepository.existsByIdLeadAndEtapaMerito(lead.getId(), ETAPA_MERITO)) {
            throw new ConflictException("Este lead ya tiene una correccion de merito registrada");
        }
        if (Objects.equals(resumenPreventa.getIdAsesorMerito(), request.getIdAsesorMerito())) {
            throw new BadRequestException("El asesor seleccionado ya tiene el merito de esta preventa");
        }

        UsuarioRolAuthResponse asesorNuevo = authEquipoClient.obtenerAsesorVentasDelEquipo(
                lead.getIdEquipo(),
                request.getIdAsesorMerito()
        );
        if (asesorNuevo == null) {
            throw new BadRequestException("El asesor seleccionado debe pertenecer al equipo del Lead y tener rol ASESOR_VENTAS");
        }

        Long idAsesorAnterior = resumenPreventa.getIdAsesorMerito();
        String nombreAsesorAnterior = resumenPreventa.getNombreAsesorMerito();
        String nombreAsesorNuevo = asesorNuevo.nombreCompleto() == null ? "" : asesorNuevo.nombreCompleto().trim();
        String motivo = normalizarMotivo(request.getMotivo());

        LeadMeritoCorreccion correccion = LeadMeritoCorreccion.builder()
                .idLead(lead.getId())
                .leadNumero(lead.getLead())
                .etapaMerito(ETAPA_MERITO)
                .idAsesorAnterior(idAsesorAnterior)
                .nombreAsesorAnterior(nombreAsesorAnterior)
                .idAsesorNuevo(asesorNuevo.empleadoId())
                .nombreAsesorNuevo(nombreAsesorNuevo)
                .idActor(currentUser.empleadoID())
                .nombreActor(currentUser.nombreCompleto())
                .rolActor(currentUser.rolPrincipal())
                .motivo(motivo)
                .build();

        LeadMeritoCorreccion savedCorreccion = guardarCorreccion(correccion);

        resumenPreventa.setIdAsesorMerito(asesorNuevo.empleadoId());
        resumenPreventa.setNombreAsesorMerito(nombreAsesorNuevo);
        leadEtapaResumenRepository.save(resumenPreventa);

        return LeadMeritoCorreccionResponse.builder()
                .idLead(lead.getId())
                .lead(lead.getLead())
                .etapaActual(lead.getEtapa())
                .estadoActual(lead.getEstado())
                .idAsesorAnterior(idAsesorAnterior)
                .nombreAsesorAnterior(nombreAsesorAnterior)
                .idAsesorNuevo(asesorNuevo.empleadoId())
                .nombreAsesorNuevo(nombreAsesorNuevo)
                .fechaMeritoPreventa(resumenPreventa.getFechaMerito())
                .idActor(savedCorreccion.getIdActor())
                .nombreActor(savedCorreccion.getNombreActor())
                .rolActor(savedCorreccion.getRolActor())
                .motivo(savedCorreccion.getMotivo())
                .fechaCorreccion(fechaCorreccion(savedCorreccion))
                .build();
    }

    private LeadMeritoCorreccion guardarCorreccion(LeadMeritoCorreccion correccion) {
        try {
            return correccionRepository.saveAndFlush(correccion);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("Este lead ya tiene una correccion de merito registrada");
        }
    }

    private LeadEtapaResumen obtenerResumenPreventaValido(Lead lead) {
        validarEtapaActual(lead);
        LeadEtapaResumen resumen = leadEtapaResumenRepository.findByIdLeadAndEtapa(lead.getId(), ETAPA_MERITO)
                .orElseThrow(() -> new BadRequestException("El lead no tiene resumen de etapa PREVENTA"));
        if (resumen.getFechaMerito() == null || resumen.getIdAsesorMerito() == null) {
            throw new BadRequestException("La preventa no es valida porque no tiene asesor y fecha de merito");
        }
        return resumen;
    }

    private void validarEtapaActual(Lead lead) {
        if (lead.getEtapa() != Etapa.VENTA && lead.getEtapa() != Etapa.POSTVENTA) {
            throw new BadRequestException("Solo se puede corregir el merito cuando el lead esta en VENTA o POSTVENTA");
        }
    }

    private LeadMeritoCorreccionCandidatoResponse toCandidatoResponse(Lead lead) {
        LeadEtapaResumen resumen = leadEtapaResumenRepository.findByIdLeadAndEtapa(lead.getId(), ETAPA_MERITO)
                .orElse(null);
        boolean yaCorregido = correccionRepository.existsByIdLeadAndEtapaMerito(lead.getId(), ETAPA_MERITO);
        String motivoNoCorregible = motivoNoCorregible(lead, resumen, yaCorregido);

        return LeadMeritoCorreccionCandidatoResponse.builder()
                .idLead(lead.getId())
                .lead(lead.getLead())
                .etapaActual(lead.getEtapa())
                .estadoActual(lead.getEstado())
                .idEquipo(lead.getIdEquipo())
                .nombreCampana(lead.getCampana() == null ? null : lead.getCampana().getNombre())
                .nombreProveedorCampana(nombreProveedorCampana(lead))
                .nombreProveedorEquipo(nombreProveedorEquipo(lead))
                .idAsesorMeritoActualPreventa(resumen == null ? null : resumen.getIdAsesorMerito())
                .asesorMeritoActualPreventa(resumen == null ? null : resumen.getNombreAsesorMerito())
                .fechaMeritoPreventa(resumen == null ? null : resumen.getFechaMerito())
                .yaCorregido(yaCorregido)
                .corregible(motivoNoCorregible == null)
                .motivoNoCorregible(motivoNoCorregible)
                .build();
    }

    private String motivoNoCorregible(Lead lead, LeadEtapaResumen resumen, boolean yaCorregido) {
        if (lead.getEtapa() != Etapa.VENTA && lead.getEtapa() != Etapa.POSTVENTA) {
            return "Solo se puede corregir el merito cuando el lead esta en VENTA o POSTVENTA";
        }
        if (resumen == null) {
            return "El lead no tiene resumen de etapa PREVENTA";
        }
        if (resumen.getFechaMerito() == null || resumen.getIdAsesorMerito() == null) {
            return "La preventa no es valida porque no tiene asesor y fecha de merito";
        }
        if (yaCorregido) {
            return "Este lead ya tiene una correccion de merito registrada";
        }
        return null;
    }

    private String nombreProveedorCampana(Lead lead) {
        return lead.getCampana() == null || lead.getCampana().getProveedor() == null
                ? null
                : lead.getCampana().getProveedor().getNombre();
    }

    private String nombreProveedorEquipo(Lead lead) {
        if (lead.getIdEquipo() == null) {
            return null;
        }
        return equipoProveedorRepository.findByIdEquipo(lead.getIdEquipo()).stream()
                .filter(EquipoProveedor::isFallbackLeadSinCampana)
                .map(EquipoProveedor::getProveedor)
                .filter(proveedor -> proveedor != null)
                .map(proveedor -> proveedor.getNombre())
                .findFirst()
                .orElse(null);
    }

    private BusquedaMeritoFiltro resolverBusquedaVenta(String buscar) {
        String valor = buscar == null ? null : buscar.trim();
        if (valor == null || valor.isBlank()) {
            return new BusquedaMeritoFiltro(false, false, null);
        }

        boolean buscarPorUsermeta = valor.startsWith("@");
        if (buscarPorUsermeta) {
            String usermeta = valor.replaceAll("\\s+", "").replaceFirst("^@+", "");
            if (usermeta.isBlank()) {
                throw new BadRequestException("El usermeta es obligatorio");
            }
            if (!usermeta.matches("[A-Za-z0-9._-]+")) {
                throw new BadRequestException("El usermeta solo puede contener letras, numeros, punto, guion o guion bajo");
            }
            return new BusquedaMeritoFiltro(true, true, usermeta);
        }

        String normalizado = valor.replaceAll("\\D+", "");
        if (normalizado.isBlank()) {
            throw new BadRequestException("El lead, documento o usermeta es obligatorio");
        }
        return new BusquedaMeritoFiltro(true, false, normalizado);
    }

    private record BusquedaMeritoFiltro(
            boolean buscando,
            boolean buscarPorUsermeta,
            String valor
    ) {
    }

    private String normalizarMotivo(String motivo) {
        if (motivo == null) {
            return null;
        }
        String normalizado = motivo.trim();
        return normalizado.isBlank() ? null : normalizado;
    }

    private Instant fechaCorreccion(LeadMeritoCorreccion correccion) {
        return correccion.getCreatedAt() == null ? OperationalDateTime.now() : correccion.getCreatedAt();
    }
}
