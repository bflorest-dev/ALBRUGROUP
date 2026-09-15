package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.*;
import pe.albrugroup.lead_service.entity.request.FreelanceVentaCrearRequest;
import pe.albrugroup.lead_service.entity.request.FreelanceVentaReenvioRequest;
import pe.albrugroup.lead_service.entity.response.*;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.*;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FreelanceService {

    private static final int ORDEN_SUBIDA = 4;
    private static final String INSTALADO = "INSTALADO";
    private static final String RETORNO = "RETORNO";
    private static final String SIN_GESTIONAR = "SIN_GESTIONAR";

    private final CurrentUser currentUser;
    private final ContactoRepository contactoRepository;
    private final LeadRepository leadRepository;
    private final PlanRepository planRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final EquipoCampoService equipoCampoService;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final EventoRepository eventoRepository;
    private final LeadEtapaResumenRepository resumenRepository;
    private final LeadEtapaResumenService resumenService;
    private final FreelanceVentaOrigenRepository origenRepository;
    private final FreelanceVentaReenvioRepository reenvioRepository;
    private final DistritoRepository distritoRepository;
    private final LeadMapper leadMapper;
    private final LeadService leadService;
    private final LeadRealtimeNotifier realtimeNotifier;
    private final EntityManager entityManager;

    @Transactional(readOnly = true)
    public FreelanceOpcionesResponse obtenerOpciones(Long idProveedor) {
        Long idEquipo = equipoActualObligatorio();
        List<EquipoProveedor> relaciones = equipoProveedorRepository.findByIdEquipo(idEquipo);
        Set<Long> permitidos = relaciones.stream()
                .filter(r -> r.getProveedor() != null && Boolean.TRUE.equals(r.getProveedor().getActivo()))
                .map(r -> r.getProveedor().getId())
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (idProveedor != null && !permitidos.contains(idProveedor)) {
            throw new ForbiddenException("El proveedor no pertenece a tu equipo");
        }
        List<FreelanceOpcionesResponse.ProveedorOpcion> proveedores = relaciones.stream()
                .filter(r -> r.getProveedor() != null && permitidos.contains(r.getProveedor().getId()))
                .map(r -> new FreelanceOpcionesResponse.ProveedorOpcion(
                        r.getProveedor().getId(), r.getProveedor().getNombre(),
                        Boolean.TRUE.equals(r.getProveedor().getRequiereSecSotVenta()),
                        equipoCampoService.resolverConfigPorProveedor(r.getProveedor().getId())))
                .distinct()
                .sorted(Comparator.comparing(FreelanceOpcionesResponse.ProveedorOpcion::nombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
        LocalDate hoy = OperationalDateTime.today();
        List<FreelanceOpcionesResponse.PlanOpcion> planes = planRepository.listarTodosPorProveedor(idProveedor).stream()
                .filter(p -> p.getProveedor() != null && permitidos.contains(p.getProveedor().getId()))
                .filter(p -> Boolean.TRUE.equals(p.getActivo()))
                .filter(p -> vigente(p, hoy))
                .map(p -> new FreelanceOpcionesResponse.PlanOpcion(
                        p.getId(), p.getNombre(), p.getPrecio(), p.getProveedor().getId(),
                        p.getProveedor().getNombre(), p.getVigenciaDesde(), p.getVigenciaHasta()))
                .toList();
        return new FreelanceOpcionesResponse(idEquipo, proveedores, planes);
    }

    @Transactional(readOnly = true)
    public FreelanceIdentidadDisponibilidadResponse validarDisponibilidad(
            String prefijo, String lead, String usermeta) {
        boolean telefono = contactoRepository.findByPrefijoAndLead(prefijo.trim(), lead.trim()).isEmpty();
        String meta = normalizarUsermeta(usermeta);
        boolean metaDisponible = meta == null || contactoRepository.findByUsermetaIgnoreCase(meta).isEmpty();
        String mensaje = !telefono ? "El telefono ya se encuentra registrado"
                : !metaDisponible ? "El usermeta ya se encuentra registrado" : null;
        return new FreelanceIdentidadDisponibilidadResponse(telefono, metaDisponible, mensaje);
    }

    @Transactional
    public FreelanceVentaResponse crear(FreelanceVentaCrearRequest request) {
        Optional<FreelanceVentaOrigen> previa = origenRepository.findByRequestId(request.getRequestId());
        if (previa.isPresent()) {
            return respuesta(previa.get(), previa.get().getRequestId(), 1, previa.get().getCreadoAt());
        }
        Long idEquipo = equipoActualObligatorio();
        Plan plan = validarPlan(request.getIdPlan(), idEquipo);
        MatrizCierre cierre = resolverCierre(plan.getProveedor().getId());
        validarIdentidadDisponible(request.getPrefijo(), request.getLead(), request.getUsermeta());

        Instant ahora = OperationalDateTime.now();
        Contacto contacto = contactoRepository.save(Contacto.builder()
                .prefijo(request.getPrefijo().trim())
                .lead(request.getLead().trim())
                .usermeta(normalizarUsermeta(request.getUsermeta()))
                .nombreConocido(request.getDatosPreventa().getNombreTitularServicio())
                .createdAt(ahora)
                .build());

        Lead lead = new Lead();
        lead.setContacto(contacto);
        lead.setPrefijo(contacto.getPrefijo());
        lead.setLead(contacto.getLead());
        lead.setNumeroParaLlamar(contacto.getLead());
        lead.setUsermeta(contacto.getUsermeta());
        lead.setIdEquipo(idEquipo);
        lead.setBase(Base.REFERIDO);
        lead.setCampana(null);
        lead.setCreatedAt(ahora);
        aplicarExpediente(lead, request.getDatosPreventa(), request.getDireccion(), plan);
        lead.setEtapa(Etapa.PREVENTA);
        lead.setEstado(EstadoSeguimiento.NUEVO);
        lead.setLastEntryAt(ahora);
        leadService.validarPreventaCompletaParaSubsanacion(lead);
        lead = leadRepository.saveAndFlush(lead);

        FreelanceVentaOrigen origen = origenRepository.saveAndFlush(FreelanceVentaOrigen.builder()
                .requestId(request.getRequestId())
                .idLead(lead.getId())
                .idFreelance(currentUser.empleadoID())
                .nombreFreelance(currentUser.nombreCompleto())
                .idEquipoOrigen(idEquipo)
                .build());

        cerrarPreventa(lead, cierre, ahora, true);
        publicarCambio(lead);
        return respuesta(origen, request.getRequestId(), 1, ahora);
    }

    @Transactional(readOnly = true)
    public FreelanceVentaPreparacionResponse prepararCorreccion(Long idLead) {
        FreelanceVentaOrigen origen = origenPropio(idLead);
        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        Evento retorno = ultimoEventoVenta(idLead).orElse(null);
        boolean puede = puedeCorregir(lead, origen);
        return new FreelanceVentaPreparacionResponse(
                idLead,
                leadService.obtenerDetalleParaCorreccion(idLead),
                retorno == null ? null : retorno.getTipificacion(),
                retorno == null ? null : retorno.getSubtipificacion(),
                retorno == null ? null : retorno.getComentario(),
                retorno == null ? null : retorno.getCreatedAt(),
                puede);
    }

    @Transactional
    public FreelanceVentaResponse reenviar(Long idLead, FreelanceVentaReenvioRequest request) {
        Optional<FreelanceVentaReenvio> previo = reenvioRepository.findByRequestId(request.getRequestId());
        if (previo.isPresent()) {
            FreelanceVentaReenvio intento = previo.get();
            if (!Objects.equals(intento.getOrigen().getIdLead(), idLead)) {
                throw new ConflictException("El requestId ya fue utilizado para otro lead");
            }
            return respuesta(intento.getOrigen(), intento.getRequestId(), intento.getNumeroIntento(), intento.getCreadoAt());
        }
        FreelanceVentaOrigen origen = origenPropio(idLead);
        Lead lead = leadRepository.findByIdForSubsanacion(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (!puedeCorregir(lead, origen)) {
            throw new ConflictException("La venta ya no esta disponible para correccion");
        }
        Plan plan = validarPlan(request.getIdPlan(), lead.getIdEquipo());
        MatrizCierre cierre = resolverCierre(plan.getProveedor().getId());
        aplicarExpediente(lead, request.getDatosPreventa(), request.getDireccion(), plan);
        leadService.validarPreventaCompletaParaSubsanacion(lead);
        leadRepository.saveAndFlush(lead);

        int numeroIntento = Math.toIntExact(reenvioRepository.countByOrigen(origen) + 2);
        FreelanceVentaReenvio intento = reenvioRepository.saveAndFlush(FreelanceVentaReenvio.builder()
                .requestId(request.getRequestId())
                .origen(origen)
                .numeroIntento(numeroIntento)
                .build());
        Instant ahora = OperationalDateTime.now();
        cerrarPreventa(lead, cierre, ahora, false);
        publicarCambio(lead);
        return respuesta(origen, request.getRequestId(), numeroIntento,
                intento.getCreadoAt() == null ? ahora : intento.getCreadoAt());
    }

    @Transactional(readOnly = true)
    public FreelanceSeguimientoResponse obtenerSeguimiento(LocalDate desde, LocalDate hasta, Long idProveedor) {
        desactivarEquipoFilter();
        LocalDate inicioFecha = desde == null ? OperationalDateTime.today().withDayOfMonth(1) : desde;
        LocalDate finFecha = hasta == null ? OperationalDateTime.today() : hasta;
        if (finFecha.isBefore(inicioFecha)) {
            throw new BadRequestException("El rango de fechas no es valido");
        }
        Instant inicio = inicioFecha.atStartOfDay(OperationalDateTime.ZONE).toInstant();
        Instant fin = finFecha.plusDays(1).atStartOfDay(OperationalDateTime.ZONE).toInstant();
        List<FreelanceVentaOrigen> origenes = origenRepository
                .findByIdFreelanceAndCreadoAtGreaterThanEqualAndCreadoAtLessThanOrderByCreadoAtDesc(
                        currentUser.empleadoID(), inicio, fin);
        List<Fila> filas = origenes.stream()
                .map(this::construirFila)
                .filter(Objects::nonNull)
                .filter(f -> idProveedor == null || Objects.equals(idProveedor, f.idProveedor()))
                .toList();

        long subidas = filas.stream().filter(Fila::subida).count();
        long instaladas = filas.stream().filter(Fila::instalada).count();
        long retornadas = filas.stream().filter(Fila::retornada).count();
        FreelanceSeguimientoResponse.Contadores contadores = new FreelanceSeguimientoResponse.Contadores(
                filas.size(), subidas, instaladas, retornadas);

        Map<String, Long> porEstado = filas.stream().collect(Collectors.groupingBy(
                Fila::clasificacion, LinkedHashMap::new, Collectors.counting()));
        List<FreelanceSeguimientoResponse.EstadoFila> estados = porEstado.entrySet().stream()
                .map(e -> new FreelanceSeguimientoResponse.EstadoFila(e.getKey(), e.getValue()))
                .toList();

        List<FreelanceSeguimientoResponse.ProveedorFila> proveedores = filas.stream()
                .collect(Collectors.groupingBy(f -> new ProveedorKey(f.idProveedor(), f.proveedor()),
                        LinkedHashMap::new, Collectors.toList()))
                .entrySet().stream()
                .map(e -> new FreelanceSeguimientoResponse.ProveedorFila(
                        e.getKey().id(), e.getKey().nombre(), e.getValue().size(),
                        e.getValue().stream().filter(Fila::subida).count(),
                        e.getValue().stream().filter(Fila::instalada).count(),
                        e.getValue().stream().filter(Fila::retornada).count()))
                .sorted(Comparator.comparing(FreelanceSeguimientoResponse.ProveedorFila::proveedor,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
        return new FreelanceSeguimientoResponse(contadores, estados, proveedores,
                filas.stream().map(Fila::detalle).toList());
    }

    private Fila construirFila(FreelanceVentaOrigen origen) {
        Lead lead = leadRepository.findById(origen.getIdLead()).orElse(null);
        if (lead == null) return null;
        LeadEtapaResumen venta = resumenRepository.findByIdLeadAndEtapa(lead.getId(), Etapa.VENTA).orElse(null);
        Evento ultimo = ultimoEventoVenta(lead.getId()).orElse(null);
        String clasificacion = lead.getEtapa() == Etapa.PREVENTA ? RETORNO
                : venta == null || venta.getUltimaCodigoTipificacion() == null
                ? SIN_GESTIONAR : venta.getUltimaCodigoTipificacion();
        boolean subida = venta != null && venta.getMayorRangoOrden() != null
                && venta.getMayorRangoOrden() >= ORDEN_SUBIDA;
        boolean instalada = INSTALADO.equals(clasificacion);
        boolean retornada = lead.getEtapa() == Etapa.PREVENTA;
        Plan plan = lead.getPlan();
        Long idProveedor = plan == null || plan.getProveedor() == null ? null : plan.getProveedor().getId();
        String proveedor = plan == null || plan.getProveedor() == null
                ? lead.getNombreProveedorSnapshot() : plan.getProveedor().getNombre();
        DatosPreventa datos = lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion();
        Distrito distrito = direccion == null || direccion.getUbigeoDomicilio() == null ? null
                : distritoRepository.findByCodigoConUbicacion(direccion.getUbigeoDomicilio()).orElse(null);
        LocalDate fechaRelevante = null;
        if (ultimo != null) {
            fechaRelevante = ultimo.getFechaProgramacion() != null ? ultimo.getFechaProgramacion()
                    : ultimo.getFechaRechazo() != null ? ultimo.getFechaRechazo() : ultimo.getFechaInstalacion();
        }
        int intentos = Math.toIntExact(reenvioRepository.countByOrigen(origen) + 1);
        boolean puede = puedeCorregir(lead, origen);
        FreelanceSeguimientoResponse.Detalle detalle = new FreelanceSeguimientoResponse.Detalle(
                lead.getId(), lead.getLead(), origen.getCreadoAt(), clasificacion,
                ultimo == null ? null : ultimo.getTipificacion(),
                ultimo == null ? null : ultimo.getSubtipificacion(),
                venta == null ? null : venta.getNombreAsesorUltimaGestion(),
                fechaRelevante, ultimo == null ? null : ultimo.getCreatedAt(),
                ultimo == null ? lead.getComentario() : ultimo.getComentario(),
                datos == null || datos.getTipoDocumento() == null ? null : datos.getTipoDocumento().name(),
                datos == null ? null : datos.getNumeroDocumentoTitularServicio(),
                datos == null ? null : datos.getNombreTitularServicio(),
                datos == null ? null : datos.getCelularRegistro(),
                datos == null ? null : datos.getCelularReferencia(),
                distrito == null || distrito.getDepartamento() == null ? null : distrito.getDepartamento().getNombre(),
                distrito == null ? null : distrito.getNombre(),
                idProveedor, proveedor, plan == null ? null : plan.getId(),
                plan == null ? lead.getNombrePlanSnapshot() : plan.getNombre(),
                lead.getEtapa(), intentos, retornada, puede);
        return new Fila(idProveedor, proveedor, clasificacion, subida, instalada, retornada, detalle);
    }

    private void cerrarPreventa(Lead lead, MatrizCierre cierre, Instant ahora, boolean registrarIngreso) {
        if (registrarIngreso) {
            eventoRepository.save(Evento.builder()
                    .idLead(lead.getId()).idActor(currentUser.empleadoID())
                    .nombreActor(currentUser.nombreCompleto()).rolActor("FREELANCE")
                    .accion(Accion.REGISTRO).etapa(Etapa.PREVENTA).createdAt(ahora).build());
            resumenService.registrarEntradaEtapa(lead.getId(), Etapa.PREVENTA, ahora);
        }
        eventoRepository.save(Evento.builder()
                .idLead(lead.getId()).idPlanOfrecido(lead.getPlan().getId())
                .idActor(currentUser.empleadoID()).nombreActor(currentUser.nombreCompleto()).rolActor("FREELANCE")
                .accion(Accion.TIPIFICACION).etapa(Etapa.PREVENTA)
                .tipificacion(cierre.tipificacion().getCodigo())
                .subtipificacion(cierre.subtipificacion().getCodigo())
                .idTipificacionResultado(cierre.tipificacion().getId())
                .idSubtipificacionResultado(cierre.subtipificacion().getId())
                .tipificacionResultado(cierre.tipificacion().getCodigo())
                .subtipificacionResultado(cierre.subtipificacion().getCodigo())
                .createdAt(ahora).build());
        resumenService.registrarTipificacion(lead.getId(), Etapa.PREVENTA,
                cierre.tipificacion().getCodigo(), cierre.subtipificacion().getCodigo(),
                cierre.tipificacion().getOrden(), currentUser.empleadoID(), currentUser.nombreCompleto(), ahora);
        resumenService.registrarMerito(lead.getId(), Etapa.PREVENTA,
                currentUser.empleadoID(), currentUser.nombreCompleto(), ahora);
        resumenService.registrarSalidaEtapa(lead.getId(), Etapa.PREVENTA, ahora);
        resumenService.registrarEntradaEtapa(lead.getId(), Etapa.VENTA, ahora);
        lead.setEtapa(Etapa.VENTA);
        lead.setEstado(EstadoSeguimiento.NUEVO);
        lead.setLastEntryAt(ahora);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
        leadRepository.save(lead);
    }

    private void aplicarExpediente(Lead lead, pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest datosRequest,
                                   pe.albrugroup.lead_service.entity.request.LeadDireccionRequest direccionRequest,
                                   Plan plan) {
        DatosPreventa datos = lead.getDatosPreventa() == null ? new DatosPreventa() : lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion() == null ? new Direccion() : lead.getDireccion();
        leadMapper.updateDatosPreventa(datosRequest, datos);
        leadMapper.updateDireccion(direccionRequest, direccion);
        lead.setDatosPreventa(datos);
        lead.setDireccion(direccion);
        lead.setPlan(plan);
        lead.setNumeroDocumentoTitularServicioSnapshot(datos.getNumeroDocumentoTitularServicio());
        lead.setDireccionSnapshot(direccion.getDireccion());
        lead.setNombrePlanSnapshot(plan.getNombre());
        lead.setNombreProveedorSnapshot(plan.getProveedor().getNombre());
        lead.setPrecioPlanSnapshot(plan.getPrecio());
        lead.setPrecioAdicionalesSnapshot(BigDecimal.ZERO);
        lead.setPrecioFinal(plan.getPrecio() == null ? BigDecimal.ZERO : plan.getPrecio());
        lead.setPromocionInterna(null);
        lead.setPlataformaDigitalOfrecida(null);
        lead.setRequiereAtencionGtr(false);
    }

    private Plan validarPlan(Long idPlan, Long idEquipo) {
        Plan plan = planRepository.findByIdAndActivoTrue(idPlan)
                .orElseThrow(() -> new NotFoundException(Plan.class, idPlan));
        if (plan.getProveedor() == null || !equipoProveedorRepository.existsByIdEquipoAndProveedorId(
                idEquipo, plan.getProveedor().getId())) {
            throw new ForbiddenException("El plan no pertenece a tu equipo");
        }
        if (!vigente(plan, OperationalDateTime.today())) {
            throw new ConflictException("El plan seleccionado no se encuentra vigente");
        }
        return plan;
    }

    private MatrizCierre resolverCierre(Long idProveedor) {
        List<Tipificacion> tipificaciones = tipificacionRepository
                .findByMatrizEtapaAndMatrizProveedorIdAndActivoTrueOrderByOrdenAsc(Etapa.PREVENTA, idProveedor);
        List<Subtipificacion> candidatas = subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(tipificaciones).stream()
                .filter(s -> s.getEtapaCambio() == Etapa.VENTA)
                .filter(s -> s.getComportamientos() != null
                        && s.getComportamientos().contains(ComportamientoTipificacion.ES_CIERRE_PREVENTA))
                .toList();
        Subtipificacion cierre = candidatas.stream()
                .filter(s -> "COMPLETA".equalsIgnoreCase(s.getCodigo()))
                .findFirst()
                .orElseGet(() -> candidatas.size() == 1 ? candidatas.get(0) : null);
        if (cierre == null) {
            throw new ConflictException("El proveedor no tiene un cierre PREVENTA / COMPLETA configurado");
        }
        return new MatrizCierre(cierre.getTipificacion(), cierre);
    }

    private FreelanceVentaOrigen origenPropio(Long idLead) {
        return origenRepository.findByIdLeadAndIdFreelance(idLead, currentUser.empleadoID())
                .orElseThrow(() -> new ForbiddenException("La venta no pertenece al usuario autenticado"));
    }

    private boolean puedeCorregir(Lead lead, FreelanceVentaOrigen origen) {
        return lead.getEtapa() == Etapa.PREVENTA
                && Objects.equals(lead.getIdAsesorAsignado(), origen.getIdFreelance())
                && currentUser.equipos().contains(lead.getIdEquipo());
    }

    private Optional<Evento> ultimoEventoVenta(Long idLead) {
        return eventoRepository.findTopByIdLeadAndAccionAndEtapaOrderByCreatedAtDescIdDesc(
                idLead, Accion.TIPIFICACION, Etapa.VENTA);
    }

    private Long equipoActualObligatorio() {
        List<Long> equipos = currentUser.equipos();
        if (equipos == null || equipos.isEmpty()) {
            throw new ConflictException("Debes pertenecer a un equipo para operar ventas");
        }
        if (equipos.size() != 1) {
            throw new ConflictException("El rol FREELANCE solo puede pertenecer a un equipo");
        }
        return equipos.get(0);
    }

    private void validarIdentidadDisponible(String prefijo, String lead, String usermeta) {
        FreelanceIdentidadDisponibilidadResponse disponible = validarDisponibilidad(prefijo, lead, usermeta);
        if (!disponible.telefonoDisponible() || !disponible.usermetaDisponible()) {
            throw new ConflictException(disponible.mensaje());
        }
    }

    private boolean vigente(Plan plan, LocalDate fecha) {
        return (plan.getVigenciaDesde() == null || !fecha.isBefore(plan.getVigenciaDesde()))
                && (plan.getVigenciaHasta() == null || !fecha.isAfter(plan.getVigenciaHasta()));
    }

    private String normalizarUsermeta(String value) {
        if (value == null) return null;
        String limpio = value.trim();
        while (limpio.startsWith("@")) limpio = limpio.substring(1);
        return limpio.isBlank() ? null : limpio;
    }

    private FreelanceVentaResponse respuesta(FreelanceVentaOrigen origen, UUID requestId, int intento, Instant at) {
        Lead lead = leadRepository.findById(origen.getIdLead()).orElse(null);
        return new FreelanceVentaResponse(origen.getId(), requestId, origen.getIdLead(),
                lead == null ? Etapa.VENTA : lead.getEtapa(), intento, at);
    }

    private void publicarCambio(Lead lead) {
        realtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("TIPIFICACION").idLead(lead.getId()).etapa(Etapa.VENTA)
                .estado(EstadoSeguimiento.NUEVO).occurredAt(OperationalDateTime.now()).build());
    }

    private void desactivarEquipoFilter() {
        Session session = entityManager.unwrap(Session.class);
        if (session.getEnabledFilter("equipoFilter") != null) {
            session.disableFilter("equipoFilter");
        }
    }

    private record MatrizCierre(Tipificacion tipificacion, Subtipificacion subtipificacion) { }
    private record ProveedorKey(Long id, String nombre) { }
    private record Fila(Long idProveedor, String proveedor, String clasificacion, boolean subida,
                        boolean instalada, boolean retornada, FreelanceSeguimientoResponse.Detalle detalle) { }
}
