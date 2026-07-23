package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.CredencialPlataforma;
import pe.albrugroup.lead_service.entity.EntregaCredencialDispositivo;
import pe.albrugroup.lead_service.entity.EntregaCredencialPlataforma;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.MarcaDispositivo;
import pe.albrugroup.lead_service.entity.PaquetePlataforma;
import pe.albrugroup.lead_service.entity.Plataforma;
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialPlataforma;
import pe.albrugroup.lead_service.entity.enums.EstadoEntregaCredencial;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.CredencialPlataformaRequest;
import pe.albrugroup.lead_service.entity.request.EntregaCredencialDispositivoRequest;
import pe.albrugroup.lead_service.entity.request.EntregaCredencialPlataformaRequest;
import pe.albrugroup.lead_service.entity.request.PaquetePlataformaRequest;
import pe.albrugroup.lead_service.entity.request.PlataformaRequest;
import pe.albrugroup.lead_service.entity.response.CredencialPlataformaResponse;
import pe.albrugroup.lead_service.entity.response.EntregaCredencialDispositivoResponse;
import pe.albrugroup.lead_service.entity.response.EntregaCredencialPlataformaResponse;
import pe.albrugroup.lead_service.entity.response.PaquetePlataformaResponse;
import pe.albrugroup.lead_service.entity.response.PlataformaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.CredencialPlataformaRepository;
import pe.albrugroup.lead_service.repository.EntregaCredencialDispositivoRepository;
import pe.albrugroup.lead_service.repository.EntregaCredencialPlataformaRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.MarcaDispositivoRepository;
import pe.albrugroup.lead_service.repository.PaquetePlataformaRepository;
import pe.albrugroup.lead_service.repository.PlataformaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PlataformaDigitalPostventaService {

    private static final Set<Etapa> ETAPAS_GESTION_POSTVENTA = Set.of(Etapa.POSTVENTA, Etapa.COBRANZA);

    private final PlataformaRepository plataformaRepository;
    private final PaquetePlataformaRepository paqueteRepository;
    private final CredencialPlataformaRepository credencialRepository;
    private final EntregaCredencialPlataformaRepository entregaRepository;
    private final EntregaCredencialDispositivoRepository dispositivoRepository;
    private final MarcaDispositivoRepository marcaRepository;
    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;

    @Transactional
    public PlataformaResponse crearPlataforma(PlataformaRequest request) {
        Plataforma plataforma = Plataforma.builder()
                .nombre(normalizarNombre(request.getNombre()))
                .activo(true)
                .build();
        return toResponse(plataformaRepository.save(plataforma));
    }

    public List<PlataformaResponse> listarPlataformasActivas() {
        return plataformaRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaquetePlataformaResponse crearPaquete(PaquetePlataformaRequest request) {
        Plataforma plataforma = plataformaRepository.findById(request.getIdPlataforma())
                .orElseThrow(() -> new NotFoundException(Plataforma.class, request.getIdPlataforma()));
        PaquetePlataforma paquete = PaquetePlataforma.builder()
                .plataforma(plataforma)
                .nombre(normalizarNombre(request.getNombre()))
                .cantidadMeses(request.getCantidadMeses())
                .cantidadUsuarios(request.getCantidadUsuarios())
                .consumeCreditos(Boolean.TRUE.equals(request.getConsumeCreditos()))
                .cantidadCreditosConsumidos(request.getCantidadCreditosConsumidos())
                .precioVenta(request.getPrecioVenta())
                .activo(true)
                .build();
        return toResponse(paqueteRepository.save(paquete));
    }

    public List<PaquetePlataformaResponse> listarPaquetesActivos(Long idPlataforma) {
        return paqueteRepository.findByPlataformaIdAndActivoTrueOrderByNombreAsc(idPlataforma).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CredencialPlataformaResponse crearCredencial(CredencialPlataformaRequest request) {
        PaquetePlataforma paquete = paqueteRepository.findById(request.getIdPaquete())
                .orElseThrow(() -> new NotFoundException(PaquetePlataforma.class, request.getIdPaquete()));
        LocalDate fechaExpiracion = request.getFechaCreacion().plusMonths(paquete.getCantidadMeses());
        CredencialPlataforma credencial = CredencialPlataforma.builder()
                .paquete(paquete)
                .usuario(request.getUsuario())
                .password(request.getPassword())
                .fechaCreacion(request.getFechaCreacion())
                .fechaExpiracion(fechaExpiracion)
                .estado(EstadoCredencialPlataforma.DISPONIBLE)
                .observacion(request.getObservacion())
                .build();
        return toResponse(credencialRepository.save(credencial));
    }

    public List<CredencialPlataformaResponse> listarCredencialesDisponibles(Long idPaquete) {
        return credencialRepository.findByPaqueteIdAndEstadoOrderByFechaExpiracionAsc(
                        idPaquete,
                        EstadoCredencialPlataforma.DISPONIBLE
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public EntregaCredencialPlataformaResponse entregarCredencial(Long idLead, EntregaCredencialPlataformaRequest request) {
        Lead lead = obtenerLeadAsignadoGestionable(idLead);
        CredencialPlataforma credencial = credencialRepository.findById(request.getIdCredencial())
                .orElseThrow(() -> new NotFoundException(CredencialPlataforma.class, request.getIdCredencial()));
        validarCredencialEntregable(credencial, request.getCantidadUsuariosAsignados());

        LocalDate fechaInicio = request.getFechaInicioAcceso() != null
                ? request.getFechaInicioAcceso()
                : (request.getFechaEntrega() != null ? request.getFechaEntrega() : OperationalDateTime.today());
        EntregaCredencialPlataforma entrega = EntregaCredencialPlataforma.builder()
                .credencial(credencial)
                .lead(lead)
                .cantidadUsuariosAsignados(request.getCantidadUsuariosAsignados())
                .esObsequio(request.getEsObsequio() == null || request.getEsObsequio())
                .montoVenta(request.getMontoVenta())
                .fechaEntrega(request.getFechaEntrega() != null ? request.getFechaEntrega() : OperationalDateTime.today())
                .fechaInicioAcceso(fechaInicio)
                .fechaFinAcceso(fechaInicio.plusMonths(credencial.getPaquete().getCantidadMeses()))
                .estado(EstadoEntregaCredencial.ACTIVA)
                .idAsesorEntrega(currentUser.empleadoID())
                .nombreAsesorEntrega(currentUser.nombreCompleto())
                .observacion(request.getObservacion())
                .build();

        EntregaCredencialPlataforma saved = entregaRepository.save(entrega);
        guardarDispositivos(saved, request.getDispositivos());
        actualizarEstadoCredencial(credencial);
        return toResponse(saved);
    }

    public List<EntregaCredencialPlataformaResponse> listarEntregasPorLead(Long idLead) {
        obtenerLeadAsignadoGestionable(idLead);
        return entregaRepository.findByLeadIdOrderByCreatedAtDesc(idLead).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<EntregaCredencialDispositivoResponse> listarDispositivos(Long idEntregaCredencial) {
        return dispositivoRepository.findByEntregaCredencialId(idEntregaCredencial).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PlataformaResponse> listarMarcasActivasComoCatalogo() {
        return marcaRepository.findByActivoTrueOrderByNombreAsc().stream()
                .map(marca -> PlataformaResponse.builder()
                        .id(marca.getId())
                        .nombre(marca.getNombre())
                        .activo(marca.getActivo())
                        .createdAt(marca.getCreatedAt())
                        .updatedAt(marca.getUpdatedAt())
                        .build())
                .toList();
    }

    private void validarCredencialEntregable(CredencialPlataforma credencial, Integer cantidadUsuariosAsignados) {
        if (credencial.getEstado() == EstadoCredencialPlataforma.EXPIRADA
                || credencial.getEstado() == EstadoCredencialPlataforma.SUSPENDIDA) {
            throw new BadRequestException("La credencial no esta disponible para entregar");
        }
        if (credencial.getFechaExpiracion() != null && credencial.getFechaExpiracion().isBefore(OperationalDateTime.today())) {
            credencial.setEstado(EstadoCredencialPlataforma.EXPIRADA);
            throw new BadRequestException("La credencial ya expiro");
        }
        int disponibles = cuposDisponibles(credencial);
        if (cantidadUsuariosAsignados > disponibles) {
            throw new BadRequestException("La credencial no tiene cupos suficientes");
        }
    }

    private void actualizarEstadoCredencial(CredencialPlataforma credencial) {
        credencial.setEstado(cuposDisponibles(credencial) <= 0
                ? EstadoCredencialPlataforma.AGOTADA
                : EstadoCredencialPlataforma.ASIGNADA);
    }

    private int cuposDisponibles(CredencialPlataforma credencial) {
        int cuposTotales = credencial.getPaquete().getCantidadUsuarios();
        long usados = entregaRepository.sumarUsuariosAsignadosPorCredencialYEstado(
                credencial.getId(),
                EstadoEntregaCredencial.ACTIVA
        );
        return (int) Math.max(0, cuposTotales - usados);
    }

    private void guardarDispositivos(
            EntregaCredencialPlataforma entrega,
            List<EntregaCredencialDispositivoRequest> dispositivos
    ) {
        if (dispositivos == null || dispositivos.isEmpty()) {
            return;
        }
        List<EntregaCredencialDispositivo> entities = dispositivos.stream()
                .map(request -> EntregaCredencialDispositivo.builder()
                        .entregaCredencial(entrega)
                        .tipoDispositivo(request.getTipoDispositivo())
                        .marcaDispositivo(resolverMarca(request))
                        .descripcion(request.getDescripcion())
                        .build())
                .toList();
        dispositivoRepository.saveAll(entities);
    }

    private MarcaDispositivo resolverMarca(EntregaCredencialDispositivoRequest request) {
        if (request.getIdMarcaDispositivo() != null) {
            return marcaRepository.findById(request.getIdMarcaDispositivo())
                    .orElseThrow(() -> new NotFoundException(MarcaDispositivo.class, request.getIdMarcaDispositivo()));
        }
        if (request.getMarcaDispositivo() == null || request.getMarcaDispositivo().isBlank()) {
            return null;
        }
        String nombre = normalizarNombre(request.getMarcaDispositivo());
        return marcaRepository.findByNombreIgnoreCase(nombre)
                .orElseGet(() -> marcaRepository.save(MarcaDispositivo.builder()
                        .nombre(nombre)
                        .activo(true)
                        .build()));
    }

    private String normalizarNombre(String nombre) {
        return nombre == null ? null : nombre.trim().toUpperCase(Locale.ROOT);
    }

    private Lead obtenerLeadAsignadoGestionable(Long idLead) {
        return leadRepository.findByIdAndIdAsesorAsignadoAndEtapaIn(
                        idLead,
                        currentUser.empleadoID(),
                        ETAPAS_GESTION_POSTVENTA
                )
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
    }

    private PlataformaResponse toResponse(Plataforma plataforma) {
        return PlataformaResponse.builder()
                .id(plataforma.getId())
                .nombre(plataforma.getNombre())
                .activo(plataforma.getActivo())
                .createdAt(plataforma.getCreatedAt())
                .updatedAt(plataforma.getUpdatedAt())
                .build();
    }

    private PaquetePlataformaResponse toResponse(PaquetePlataforma paquete) {
        return PaquetePlataformaResponse.builder()
                .id(paquete.getId())
                .idPlataforma(paquete.getPlataforma().getId())
                .plataforma(paquete.getPlataforma().getNombre())
                .nombre(paquete.getNombre())
                .cantidadMeses(paquete.getCantidadMeses())
                .cantidadUsuarios(paquete.getCantidadUsuarios())
                .consumeCreditos(paquete.getConsumeCreditos())
                .cantidadCreditosConsumidos(paquete.getCantidadCreditosConsumidos())
                .precioVenta(paquete.getPrecioVenta())
                .activo(paquete.getActivo())
                .createdAt(paquete.getCreatedAt())
                .updatedAt(paquete.getUpdatedAt())
                .build();
    }

    private CredencialPlataformaResponse toResponse(CredencialPlataforma credencial) {
        int cuposTotales = credencial.getPaquete().getCantidadUsuarios();
        long cuposUsados = entregaRepository.sumarUsuariosAsignadosPorCredencialYEstado(
                credencial.getId(),
                EstadoEntregaCredencial.ACTIVA
        );
        return CredencialPlataformaResponse.builder()
                .id(credencial.getId())
                .idPaquete(credencial.getPaquete().getId())
                .paquete(credencial.getPaquete().getNombre())
                .idPlataforma(credencial.getPaquete().getPlataforma().getId())
                .plataforma(credencial.getPaquete().getPlataforma().getNombre())
                .usuario(credencial.getUsuario())
                .password(credencial.getPassword())
                .fechaCreacion(credencial.getFechaCreacion())
                .fechaExpiracion(credencial.getFechaExpiracion())
                .estado(credencial.getEstado())
                .cuposTotales(cuposTotales)
                .cuposUsados(cuposUsados)
                .cuposDisponibles((int) Math.max(0, cuposTotales - cuposUsados))
                .observacion(credencial.getObservacion())
                .createdAt(credencial.getCreatedAt())
                .updatedAt(credencial.getUpdatedAt())
                .build();
    }

    private EntregaCredencialPlataformaResponse toResponse(EntregaCredencialPlataforma entrega) {
        CredencialPlataforma credencial = entrega.getCredencial();
        return EntregaCredencialPlataformaResponse.builder()
                .id(entrega.getId())
                .idLead(entrega.getLead().getId())
                .idCredencial(credencial.getId())
                .plataforma(credencial.getPaquete().getPlataforma().getNombre())
                .paquete(credencial.getPaquete().getNombre())
                .usuario(credencial.getUsuario())
                .cantidadUsuariosAsignados(entrega.getCantidadUsuariosAsignados())
                .esObsequio(entrega.getEsObsequio())
                .montoVenta(entrega.getMontoVenta())
                .fechaEntrega(entrega.getFechaEntrega())
                .fechaInicioAcceso(entrega.getFechaInicioAcceso())
                .fechaFinAcceso(entrega.getFechaFinAcceso())
                .estado(entrega.getEstado())
                .idAsesorEntrega(entrega.getIdAsesorEntrega())
                .nombreAsesorEntrega(entrega.getNombreAsesorEntrega())
                .observacion(entrega.getObservacion())
                .dispositivos(listarDispositivos(entrega.getId()))
                .createdAt(entrega.getCreatedAt())
                .updatedAt(entrega.getUpdatedAt())
                .build();
    }

    private EntregaCredencialDispositivoResponse toResponse(EntregaCredencialDispositivo dispositivo) {
        MarcaDispositivo marca = dispositivo.getMarcaDispositivo();
        return EntregaCredencialDispositivoResponse.builder()
                .id(dispositivo.getId())
                .tipoDispositivo(dispositivo.getTipoDispositivo())
                .idMarcaDispositivo(marca == null ? null : marca.getId())
                .marcaDispositivo(marca == null ? null : marca.getNombre())
                .descripcion(dispositivo.getDescripcion())
                .build();
    }
}
