package pe.albrugroup.lead_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.enums.*;
import pe.albrugroup.lead_service.entity.request.SubsanacionRequest;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.entity.response.SubsanacionLeadBusquedaResponse;
import pe.albrugroup.lead_service.entity.response.SubsanacionOpcionesResponse;
import pe.albrugroup.lead_service.entity.response.SubsanacionResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.*;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SubsanacionService {

    private static final int LIMITE_BUSQUEDA = 50;

    private final LeadRepository leadRepository;
    private final ContactoRepository contactoRepository;
    private final CampanaRepository campanaRepository;
    private final PlanRepository planRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final EventoRepository eventoRepository;
    private final LeadEtapaResumenRepository resumenRepository;
    private final CalendarioFacturacionPostventaRepository calendarioRepository;
    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final PagoPostventaRepository pagoRepository;
    private final EncuestaPostventaRepository encuestaRepository;
    private final EntregaCredencialPlataformaRepository entregaRepository;
    private final EntregaCredencialDispositivoRepository dispositivoRepository;
    private final SubsanacionAuditoriaRepository auditoriaRepository;
    private final CalendarioFacturacionPostventaService calendarioService;
    private final LeadService leadService;
    private final LeadMapper leadMapper;
    private final LeadRealtimeNotifier realtimeNotifier;
    private final CurrentUser currentUser;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<SubsanacionLeadBusquedaResponse> buscarLeads(String buscar) {
        String patron = normalizarPatron(buscar);
        if (patron == null) {
            return List.of();
        }
        return leadRepository.buscarParaCorreccionAdmin(patron, PageRequest.of(0, LIMITE_BUSQUEDA))
                .stream()
                .map(this::toBusqueda)
                .toList();
    }

    @Transactional(readOnly = true)
    public SubsanacionOpcionesResponse obtenerOpciones(Long idEquipo, Long idProveedor) {
        if (idEquipo == null || idEquipo <= 0) {
            throw new BadRequestException("Selecciona un equipo valido");
        }

        List<EquipoProveedor> relaciones = equipoProveedorRepository.findByIdEquipo(idEquipo);
        Set<Long> proveedoresPermitidos = new HashSet<>();
        List<SubsanacionOpcionesResponse.ProveedorOpcion> proveedores = relaciones.stream()
                .filter(relacion -> relacion.getProveedor() != null)
                .peek(relacion -> proveedoresPermitidos.add(relacion.getProveedor().getId()))
                .map(relacion -> new SubsanacionOpcionesResponse.ProveedorOpcion(
                        relacion.getProveedor().getId(),
                        relacion.getProveedor().getNombre(),
                        Boolean.TRUE.equals(relacion.getProveedor().getActivo())))
                .distinct()
                .sorted(Comparator.comparing(SubsanacionOpcionesResponse.ProveedorOpcion::nombre,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();

        if (idProveedor != null && !proveedoresPermitidos.contains(idProveedor)) {
            throw new ConflictException("El proveedor no pertenece al equipo seleccionado");
        }

        List<SubsanacionOpcionesResponse.CampanaOpcion> campanas = campanaRepository.listarTodasPorEquipo(idEquipo)
                .stream()
                .filter(c -> idProveedor == null || (c.getProveedor() != null
                        && Objects.equals(c.getProveedor().getId(), idProveedor)))
                .map(c -> new SubsanacionOpcionesResponse.CampanaOpcion(
                        c.getId(), c.getNombre(), c.getProveedor().getId(), c.getProveedor().getNombre(),
                        Boolean.TRUE.equals(c.getActivo())))
                .toList();

        List<SubsanacionOpcionesResponse.PlanOpcion> planes = planRepository.listarTodosPorProveedor(idProveedor)
                .stream()
                .filter(p -> p.getProveedor() != null && proveedoresPermitidos.contains(p.getProveedor().getId()))
                .map(p -> new SubsanacionOpcionesResponse.PlanOpcion(
                        p.getId(), p.getNombre(), p.getPrecio(), p.getProveedor().getId(), p.getProveedor().getNombre(),
                        p.getVigenciaDesde(), p.getVigenciaHasta(), Boolean.TRUE.equals(p.getActivo())))
                .toList();

        return SubsanacionOpcionesResponse.builder()
                .idEquipo(idEquipo)
                .proveedores(proveedores)
                .campanas(campanas)
                .planes(planes)
                .preventa(opcionesTipificacion(idEquipo, Etapa.PREVENTA,
                        ComportamientoTipificacion.ES_CIERRE_PREVENTA, Etapa.VENTA))
                .venta(opcionesTipificacion(idEquipo, Etapa.VENTA,
                        ComportamientoTipificacion.REQUIERE_FECHA_INSTALACION, Etapa.POSTVENTA))
                .build();
    }

    @Transactional(readOnly = true)
    public SubsanacionResponse obtener(Long idSubsanacion) {
        return toResponse(auditoriaRepository.findById(idSubsanacion)
                .orElseThrow(() -> new NotFoundException(SubsanacionAuditoria.class, idSubsanacion)));
    }

    @Transactional
    public SubsanacionResponse subsanar(SubsanacionRequest request) {
        Optional<SubsanacionAuditoria> previa = auditoriaRepository.findByRequestId(request.getRequestId());
        if (previa.isPresent()) {
            return toResponse(previa.get());
        }

        validarFechas(request.getFechaGestion(), request.getFechaInstalacion());
        Contexto contexto = resolverContexto(request);
        // La campana se carga con lock de escritura. Tras esperar el lock, una segunda peticion con
        // el mismo requestId ya puede observar el acta confirmada y devolverla sin duplicar nada.
        previa = auditoriaRepository.findByRequestId(request.getRequestId());
        if (previa.isPresent()) {
            return toResponse(previa.get());
        }
        Instant subsanacionAt = at(request.getFechaGestion(), 9, 0);
        Instant registroAt = at(request.getFechaGestion(), 9, 1);
        Instant asignacionAt = at(request.getFechaGestion(), 9, 2);
        Instant preventaAt = at(request.getFechaGestion(), 9, 3);
        Instant ventaAt = at(request.getFechaGestion(), 9, 4);

        Lead lead;
        String snapshotAnterior;
        Impacto impacto;
        int hermanasAfectadas;

        if (request.getModo() == ModoSubsanacion.EXISTENTE) {
            if (request.getIdLead() == null) {
                throw new BadRequestException("idLead es obligatorio en modo EXISTENTE");
            }
            lead = leadRepository.findByIdForSubsanacion(request.getIdLead())
                    .orElseThrow(() -> new NotFoundException(Lead.class, request.getIdLead()));
            impacto = calcularImpacto(lead);
            validarConfirmacionPostventa(lead, impacto, request.isConfirmarRecreacionPostventa());
            snapshotAnterior = serializar(crearSnapshot(lead));
            hermanasAfectadas = actualizarContactoExistente(lead, request);
            eliminarEstadoAnterior(lead.getId(), impacto);
        } else {
            if (request.getIdLead() != null) {
                throw new BadRequestException("idLead no se permite en modo NUEVO");
            }
            impacto = Impacto.vacio();
            snapshotAnterior = null;
            hermanasAfectadas = 0;
            lead = crearLeadNuevo(request, subsanacionAt);
        }

        aplicarDatosCanonicos(lead, request, contexto, subsanacionAt, ventaAt);
        leadService.validarPreventaCompletaParaSubsanacion(lead);
        validarCamposVenta(request, contexto.plan().getProveedor(), contexto.venta());
        lead = leadRepository.saveAndFlush(lead);

        SubsanacionAuditoria auditoria = auditoriaRepository.saveAndFlush(SubsanacionAuditoria.builder()
                .requestId(request.getRequestId())
                .idLead(lead.getId())
                .modo(request.getModo())
                .idAdmin(currentUser.empleadoID())
                .nombreAdmin(currentUser.nombreCompleto())
                .rolAdmin(currentUser.rolPrincipal())
                .fechaGestion(request.getFechaGestion())
                .fechaInstalacion(request.getFechaInstalacion())
                .motivo(request.getMotivo().trim())
                .snapshotAnterior(snapshotAnterior)
                .eventosReemplazados(impacto.eventos())
                .resumenesReemplazados(impacto.resumenes())
                .artefactosPostventaReemplazados(impacto.artefactosPostventa())
                .oportunidadesHermanasAfectadas(hermanasAfectadas)
                .build());

        crearEventos(lead, request, contexto, auditoria.getId(),
                subsanacionAt, registroAt, asignacionAt, preventaAt, ventaAt);
        crearResumenes(lead, contexto, registroAt, preventaAt, ventaAt);

        calendarioService.inicializarGestionPostventa(lead, request.getFechaInstalacion(), ventaAt);
        CalendarioFacturacionPostventa calendarioCreado = calendarioRepository.findByLeadId(lead.getId())
                .orElseThrow(() -> new IllegalStateException("No se creo el calendario inicial de Postventa"));
        lead.setDiaCorteFacturacion(calendarioCreado.getDiaCorte());
        leadRepository.save(lead);

        auditoria.setSnapshotResultado(serializar(crearSnapshot(lead)));
        auditoriaRepository.save(auditoria);

        realtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("SUBSANACION_COMPLETADA")
                .idLead(lead.getId())
                .etapa(Etapa.POSTVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .occurredAt(OperationalDateTime.now())
                .build());

        return toResponse(auditoria);
    }

    private Contexto resolverContexto(SubsanacionRequest request) {
        Campana campana = campanaRepository.findByIdForSubsanacion(request.getIdCampana())
                .orElseThrow(() -> new NotFoundException(Campana.class, request.getIdCampana()));
        Plan plan = planRepository.findById(request.getIdPlan())
                .orElseThrow(() -> new NotFoundException(Plan.class, request.getIdPlan()));
        if (campana.getProveedor() == null || !equipoProveedorRepository.existsByIdEquipoAndProveedorId(
                request.getIdEquipo(), campana.getProveedor().getId())) {
            throw new ConflictException("La campana no pertenece al equipo seleccionado");
        }
        if (plan.getProveedor() == null || !equipoProveedorRepository.existsByIdEquipoAndProveedorId(
                request.getIdEquipo(), plan.getProveedor().getId())) {
            throw new ConflictException("El plan no pertenece al equipo seleccionado");
        }
        if (!Objects.equals(campana.getProveedor().getId(), plan.getProveedor().getId())) {
            throw new ConflictException("La campana y el plan deben pertenecer al mismo proveedor");
        }

        Matriz preventa = resolverMatriz(request.getIdEquipo(), Etapa.PREVENTA,
                request.getCodigoTipificacionPreventa(), request.getCodigoSubtipificacionPreventa(),
                ComportamientoTipificacion.ES_CIERRE_PREVENTA, Etapa.VENTA);
        Matriz venta = resolverMatriz(request.getIdEquipo(), Etapa.VENTA,
                request.getCodigoTipificacionVenta(), request.getCodigoSubtipificacionVenta(),
                ComportamientoTipificacion.REQUIERE_FECHA_INSTALACION, Etapa.POSTVENTA);
        return new Contexto(campana, plan, preventa, venta);
    }

    private Matriz resolverMatriz(
            Long idEquipo,
            Etapa etapa,
            String codigoTipificacion,
            String codigoSubtipificacion,
            ComportamientoTipificacion comportamiento,
            Etapa destino
    ) {
        Tipificacion tipificacion = tipificacionRepository.findByEtapaAndIdEquipoAndCodigo(
                        etapa, idEquipo, codigoTipificacion.trim())
                .orElseThrow(() -> new NotFoundException(Tipificacion.class, codigoTipificacion));
        Subtipificacion subtipificacion = subtipificacionRepository.findByTipificacionIdAndCodigo(
                        tipificacion.getId(), codigoSubtipificacion.trim())
                .orElseThrow(() -> new NotFoundException(Subtipificacion.class, codigoSubtipificacion));
        Set<ComportamientoTipificacion> comportamientos = subtipificacion.getComportamientos() == null
                ? Set.of()
                : subtipificacion.getComportamientos();
        if (subtipificacion.getEtapaCambio() != destino || !comportamientos.contains(comportamiento)) {
            throw new BadRequestException("La tipificacion seleccionada no representa el avance requerido de " + etapa);
        }
        return new Matriz(tipificacion, subtipificacion);
    }

    private Lead crearLeadNuevo(SubsanacionRequest request, Instant createdAt) {
        String prefijo = request.getPrefijo().trim();
        String numero = request.getLead().trim();
        contactoRepository.findByPrefijoAndLead(prefijo, numero).ifPresent(contacto -> {
            throw new ConflictException("El telefono ya existe. Selecciona una oportunidad y usa el modo EXISTENTE");
        });
        String usermeta = normalizarUsermeta(request.getUsermeta());
        if (usermeta != null && contactoRepository.findByUsermetaIgnoreCase(usermeta).isPresent()) {
            throw new ConflictException("El usermeta pertenece a otro contacto");
        }

        Contacto contacto = contactoRepository.save(Contacto.builder()
                .prefijo(prefijo)
                .lead(numero)
                .usermeta(usermeta)
                .nombreConocido(request.getDatosPreventa().getNombreTitularServicio())
                .createdAt(createdAt)
                .build());
        Lead lead = new Lead();
        lead.setContacto(contacto);
        lead.setPrefijo(prefijo);
        lead.setLead(numero);
        lead.setUsermeta(usermeta);
        lead.setNumeroParaLlamar(numero);
        lead.setCreatedAt(createdAt);
        return lead;
    }

    private int actualizarContactoExistente(Lead lead, SubsanacionRequest request) {
        if (!Objects.equals(lead.getLead(), request.getLead().trim())) {
            throw new BadRequestException("El numero del lead no puede cambiar en una subsanacion existente");
        }
        Contacto contacto = lead.getContacto();
        if (contacto == null) {
            throw new ConflictException("El lead no tiene Contacto asociado. Corrige primero su identidad en Bitacora");
        }
        String prefijo = request.getPrefijo().trim();
        String usermeta = normalizarUsermeta(request.getUsermeta());
        contactoRepository.findByPrefijoAndLead(prefijo, lead.getLead())
                .filter(otro -> !otro.getId().equals(contacto.getId()))
                .ifPresent(otro -> {
                    throw new ConflictException("El prefijo y numero pertenecen a otro contacto");
                });
        if (usermeta != null) {
            contactoRepository.findByUsermetaIgnoreCase(usermeta)
                    .filter(otro -> !otro.getId().equals(contacto.getId()))
                    .ifPresent(otro -> {
                        throw new ConflictException("El usermeta pertenece a otro contacto");
                    });
        }

        long hermanas = Math.max(0, leadRepository.countByContactoId(contacto.getId()) - 1);
        boolean cambiaIdentidad = !Objects.equals(contacto.getPrefijo(), prefijo)
                || !Objects.equals(normalizarUsermeta(contacto.getUsermeta()), usermeta);
        if (cambiaIdentidad && hermanas > 0 && !request.isConfirmarImpactoContacto()) {
            throw new ConflictException("El cambio de prefijo o usermeta afectara a " + hermanas
                    + " oportunidades hermanas. Confirma el impacto para continuar");
        }

        contacto.setPrefijo(prefijo);
        contacto.setUsermeta(usermeta);
        contacto.setNombreConocido(request.getDatosPreventa().getNombreTitularServicio());
        contactoRepository.save(contacto);
        int afectadas = leadRepository.sincronizarIdentidadHermanas(
                contacto.getId(), lead.getId(), prefijo, lead.getLead(), usermeta);
        lead.setPrefijo(prefijo);
        lead.setUsermeta(usermeta);
        lead.setNumeroParaLlamar(lead.getLead());
        return afectadas;
    }

    private void aplicarDatosCanonicos(
            Lead lead,
            SubsanacionRequest request,
            Contexto contexto,
            Instant createdAt,
            Instant ventaAt
    ) {
        DatosPreventa datos = lead.getDatosPreventa() == null ? new DatosPreventa() : lead.getDatosPreventa();
        Direccion direccion = lead.getDireccion() == null ? new Direccion() : lead.getDireccion();
        leadMapper.updateDatosPreventa(request.getDatosPreventa(), datos);
        leadMapper.updateDireccion(request.getDireccion(), direccion);

        lead.setIdEquipo(request.getIdEquipo());
        lead.setCampana(contexto.campana());
        lead.setBase(request.getBase());
        lead.setDatosPreventa(datos);
        lead.setDireccion(direccion);
        lead.setPlan(contexto.plan());
        lead.setNumeroDocumentoTitularServicioSnapshot(datos.getNumeroDocumentoTitularServicio());
        lead.setDireccionSnapshot(direccion.getDireccion());
        lead.setNombrePlanSnapshot(contexto.plan().getNombre());
        lead.setNombreProveedorSnapshot(contexto.plan().getProveedor().getNombre());
        lead.setPrecioPlanSnapshot(contexto.plan().getPrecio());
        lead.setPromocionInterna(null);
        lead.setNombrePromocionInternaSnapshot(null);
        lead.setPlataformaDigitalOfrecida(null);
        if (lead.getAdicionales() != null) {
            lead.getAdicionales().clear();
        }
        lead.setPrecioAdicionalesSnapshot(BigDecimal.ZERO);
        lead.setPrecioFinal(contexto.plan().getPrecio() == null ? BigDecimal.ZERO : contexto.plan().getPrecio());
        lead.setSec(normalizarTexto(request.getSec()));
        lead.setSot(normalizarTexto(request.getSot()));
        lead.setCustomerId(normalizarTexto(request.getCustomerId()));
        lead.setEtapa(Etapa.POSTVENTA);
        lead.setEstado(EstadoSeguimiento.NUEVO);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setRequiereAtencionGtr(false);
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
        lead.setLastEntryAt(ventaAt);
        lead.setCreatedAt(createdAt);
        lead.setMesesPermanenciaSnapshot(contexto.plan().getProveedor().getMesesPermanencia());
        lead.setEstadoClientePostventa(EstadoClientePostventa.ACTIVO);
        lead.setDiaCorteFacturacion(null);
    }

    private void crearEventos(
            Lead lead,
            SubsanacionRequest request,
            Contexto contexto,
            Long idAuditoria,
            Instant subsanacionAt,
            Instant registroAt,
            Instant asignacionAt,
            Instant preventaAt,
            Instant ventaAt
    ) {
        Long admin = currentUser.empleadoID();
        String nombre = currentUser.nombreCompleto();
        String rol = currentUser.rolPrincipal();
        Long idCampana = contexto.campana().getId();
        Long idPlan = contexto.plan().getId();
        List<Evento> eventos = List.of(
                eventoBase(lead.getId(), idCampana, admin, nombre, rol, Accion.SUBSANACION, Etapa.PREVENTA,
                        subsanacionAt, "Subsanacion #" + idAuditoria + " · Motivo: " + request.getMotivo().trim()),
                eventoBase(lead.getId(), idCampana, admin, nombre, rol, Accion.REGISTRO, Etapa.PREVENTA,
                        registroAt, null),
                Evento.builder()
                        .idLead(lead.getId()).idCampana(idCampana)
                        .idActor(admin).nombreActor(nombre).rolActor(rol)
                        .idAsesorAsignado(admin).nombreAsesorAsignado(nombre)
                        .accion(Accion.ASIGNACION).etapa(Etapa.PREVENTA).createdAt(asignacionAt).build(),
                Evento.builder()
                        .idLead(lead.getId()).idCampana(idCampana).idPlanOfrecido(idPlan)
                        .idActor(admin).nombreActor(nombre).rolActor(rol)
                        .accion(Accion.TIPIFICACION).etapa(Etapa.PREVENTA)
                        .tipificacion(contexto.preventa().tipificacion().getCodigo())
                        .subtipificacion(contexto.preventa().subtipificacion().getCodigo())
                        .comentario(request.getMotivo().trim()).createdAt(preventaAt).build(),
                Evento.builder()
                        .idLead(lead.getId()).idCampana(idCampana).idPlanOfrecido(idPlan)
                        .idActor(admin).nombreActor(nombre).rolActor(rol)
                        .accion(Accion.TIPIFICACION).etapa(Etapa.VENTA)
                        .tipificacion(contexto.venta().tipificacion().getCodigo())
                        .subtipificacion(contexto.venta().subtipificacion().getCodigo())
                        .fechaInstalacion(request.getFechaInstalacion())
                        .comentario(request.getMotivo().trim()).createdAt(ventaAt).build()
        );
        eventoRepository.saveAll(eventos);
    }

    private Evento eventoBase(
            Long idLead, Long idCampana, Long admin, String nombre, String rol,
            Accion accion, Etapa etapa, Instant createdAt, String comentario
    ) {
        return Evento.builder()
                .idLead(idLead).idCampana(idCampana)
                .idActor(admin).nombreActor(nombre).rolActor(rol)
                .accion(accion).etapa(etapa).createdAt(createdAt).comentario(comentario)
                .build();
    }

    private void crearResumenes(Lead lead, Contexto contexto, Instant registroAt, Instant preventaAt, Instant ventaAt) {
        Long admin = currentUser.empleadoID();
        String nombre = currentUser.nombreCompleto();
        Matriz pre = contexto.preventa();
        Matriz ven = contexto.venta();

        LeadEtapaResumen preventa = resumenCompleto(
                lead.getId(), Etapa.PREVENTA, registroAt, preventaAt,
                pre.tipificacion().getCodigo(), pre.subtipificacion().getCodigo(), pre.tipificacion().getOrden(),
                1, admin, nombre);
        LeadEtapaResumen venta = resumenCompleto(
                lead.getId(), Etapa.VENTA, preventaAt, ventaAt,
                ven.tipificacion().getCodigo(), ven.subtipificacion().getCodigo(), ven.tipificacion().getOrden(),
                0, admin, nombre);
        LeadEtapaResumen postventa = LeadEtapaResumen.builder()
                .idLead(lead.getId())
                .etapa(Etapa.POSTVENTA)
                .fechaIngresoEtapa(ventaAt)
                .numeroPasadas(1)
                .totalTipificaciones(0)
                .totalAsignaciones(0)
                .createdAt(ventaAt)
                .build();
        resumenRepository.saveAll(List.of(preventa, venta, postventa));
    }

    private LeadEtapaResumen resumenCompleto(
            Long idLead, Etapa etapa, Instant ingreso, Instant salida,
            String tipificacion, String subtipificacion, Integer orden,
            int asignaciones, Long admin, String nombre
    ) {
        return LeadEtapaResumen.builder()
                .idLead(idLead).etapa(etapa)
                .fechaIngresoEtapa(ingreso).fechaSalidaEtapa(salida)
                .numeroPasadas(1).totalTipificaciones(1).totalAsignaciones(asignaciones)
                .primeraCodigoTipificacion(tipificacion).primeraCodigoSubtipificacion(subtipificacion)
                .primeraTipificacionOrden(orden).primeraTipificacionAt(salida)
                .ultimaCodigoTipificacion(tipificacion).ultimaCodigoSubtipificacion(subtipificacion)
                .ultimaTipificacionOrden(orden).ultimaTipificacionAt(salida)
                .mayorRangoCodigoTipificacion(tipificacion).mayorRangoCodigoSubtipificacion(subtipificacion)
                .mayorRangoOrden(orden).mayorRangoAt(salida)
                .idAsesorMerito(admin).nombreAsesorMerito(nombre).fechaMerito(salida)
                .idAsesorUltimaGestion(admin).nombreAsesorUltimaGestion(nombre).fechaUltimaGestion(salida)
                .createdAt(ingreso)
                .build();
    }

    private void eliminarEstadoAnterior(Long idLead, Impacto impacto) {
        List<Long> idsEntregas = entregaRepository.findByLeadIdOrderByCreatedAtDesc(idLead)
                .stream().map(EntregaCredencialPlataforma::getId).toList();
        if (!idsEntregas.isEmpty()) {
            dispositivoRepository.deleteByEntregaCredencialIdIn(idsEntregas);
        }
        entregaRepository.deleteByLeadId(idLead);
        pagoRepository.deleteByLeadId(idLead);
        encuestaRepository.deleteByLeadId(idLead);
        periodoRepository.deleteByLeadId(idLead);
        calendarioRepository.deleteByLeadId(idLead);
        eventoRepository.deleteByIdLead(idLead);
        resumenRepository.deleteByIdLead(idLead);
        calendarioRepository.flush();
        eventoRepository.flush();
        resumenRepository.flush();
    }

    private void validarConfirmacionPostventa(Lead lead, Impacto impacto, boolean confirmado) {
        if ((lead.getEtapa() == Etapa.POSTVENTA || impacto.artefactosPostventa() > 0) && !confirmado) {
            throw new ConflictException("La subsanacion reconstruira " + impacto.artefactosPostventa()
                    + " artefactos de Postventa. Confirma expresamente para continuar");
        }
    }

    private void validarFechas(LocalDate fechaGestion, LocalDate fechaInstalacion) {
        LocalDate hoy = OperationalDateTime.today();
        LocalDate minimo = hoy.minusMonths(6);
        if (fechaGestion.isBefore(minimo) || !fechaGestion.isBefore(hoy)) {
            throw new BadRequestException("fechaGestion debe estar entre " + minimo + " y " + hoy.minusDays(1));
        }
        if (fechaInstalacion.isBefore(fechaGestion) || fechaInstalacion.isAfter(hoy)) {
            throw new BadRequestException("fechaInstalacion debe estar entre fechaGestion y hoy");
        }
    }

    private void validarCamposVenta(SubsanacionRequest request, Proveedor proveedor, Matriz venta) {
        Set<ComportamientoTipificacion> comportamientos = venta.subtipificacion().getComportamientos() == null
                ? Set.of() : venta.subtipificacion().getComportamientos();
        boolean requiereCustomer = comportamientos.contains(ComportamientoTipificacion.REQUIERE_CUSTOMER_ID);
        boolean requiereSecSot = comportamientos.contains(ComportamientoTipificacion.REQUIERE_SEC_SOT)
                && Boolean.TRUE.equals(proveedor.getRequiereSecSotVenta());
        if (requiereCustomer) {
            validarCodigo(request.getCustomerId(), 8, "customerId");
        }
        if (requiereSecSot) {
            if (!requiereCustomer) {
                validarCodigo(request.getSec(), 9, "sec");
            }
            validarCodigo(request.getSot(), 8, "sot");
        }
    }

    private void validarCodigo(String valor, int longitud, String campo) {
        if (valor == null || !valor.trim().matches("\\d{" + longitud + "}")) {
            throw new BadRequestException(campo + " debe tener " + longitud + " digitos");
        }
    }

    private List<SubsanacionOpcionesResponse.TipificacionOpcion> opcionesTipificacion(
            Long idEquipo, Etapa etapa, ComportamientoTipificacion comportamiento, Etapa destino) {
        List<Tipificacion> tipificaciones = tipificacionRepository.findByEtapaAndIdEquipoOrderByOrdenAsc(etapa, idEquipo);
        if (tipificaciones.isEmpty()) {
            return List.of();
        }
        return subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(tipificaciones)
                .stream()
                .filter(s -> s.getEtapaCambio() == destino)
                .filter(s -> s.getComportamientos() != null && s.getComportamientos().contains(comportamiento))
                .map(s -> new SubsanacionOpcionesResponse.TipificacionOpcion(
                        s.getTipificacion().getId(), s.getTipificacion().getCodigo(), s.getTipificacion().getDescripcion(),
                        s.getTipificacion().getOrden(), Boolean.TRUE.equals(s.getTipificacion().getActivo()),
                        s.getId(), s.getCodigo(), s.getDescripcion(), s.getOrden(), Boolean.TRUE.equals(s.getActivo()),
                        s.getEtapaCambio(), Set.copyOf(s.getComportamientos())))
                .toList();
    }

    private SubsanacionLeadBusquedaResponse toBusqueda(Lead lead) {
        Impacto impacto = calcularImpacto(lead);
        DatosPreventa datos = lead.getDatosPreventa();
        Plan plan = lead.getPlan();
        long hermanas = lead.getContacto() == null ? 0 : Math.max(0, leadRepository.countByContactoId(lead.getContacto().getId()) - 1);
        return SubsanacionLeadBusquedaResponse.builder()
                .idLead(lead.getId()).idContacto(lead.getContacto() == null ? null : lead.getContacto().getId())
                .prefijo(lead.getPrefijo()).lead(lead.getLead()).usermeta(lead.getUsermeta())
                .titular(datos == null ? null : datos.getNombreTitularServicio())
                .numeroDocumento(datos == null ? lead.getNumeroDocumentoTitularServicioSnapshot() : datos.getNumeroDocumentoTitularServicio())
                .idEquipo(lead.getIdEquipo()).etapa(lead.getEtapa())
                .campana(lead.getCampana() == null ? null : lead.getCampana().getNombre())
                .proveedor(plan == null || plan.getProveedor() == null ? lead.getNombreProveedorSnapshot() : plan.getProveedor().getNombre())
                .plan(plan == null ? lead.getNombrePlanSnapshot() : plan.getNombre())
                .createdAt(lead.getCreatedAt()).lastEntryAt(lead.getLastEntryAt())
                .oportunidadesHermanas(hermanas)
                .eventos(impacto.eventos()).resumenesEtapa(impacto.resumenes())
                .calendariosPostventa(impacto.calendarios()).periodosPostventa(impacto.periodos())
                .pagosPostventa(impacto.pagos()).encuestasPostventa(impacto.encuestas())
                .entregasCredenciales(impacto.entregas()).dispositivosEntregados(impacto.dispositivos())
                .requiereConfirmacionContacto(hermanas > 0)
                .requiereConfirmacionPostventa(lead.getEtapa() == Etapa.POSTVENTA || impacto.artefactosPostventa() > 0)
                .build();
    }

    private Impacto calcularImpacto(Lead lead) {
        Long idLead = lead.getId();
        List<Long> idsEntregas = entregaRepository.findByLeadIdOrderByCreatedAtDesc(idLead)
                .stream().map(EntregaCredencialPlataforma::getId).toList();
        int dispositivos = idsEntregas.isEmpty() ? 0
                : Math.toIntExact(dispositivoRepository.countByEntregaCredencialIdIn(idsEntregas));
        return new Impacto(
                Math.toIntExact(eventoRepository.countByIdLead(idLead)),
                resumenRepository.findByIdLead(idLead).size(),
                Math.toIntExact(calendarioRepository.countByLeadId(idLead)),
                Math.toIntExact(periodoRepository.countByLeadId(idLead)),
                Math.toIntExact(pagoRepository.countByLeadId(idLead)),
                Math.toIntExact(encuestaRepository.countByLeadId(idLead)),
                idsEntregas.size(),
                dispositivos);
    }

    private Map<String, Object> crearSnapshot(Lead lead) {
        Map<String, Object> snapshot = linkedMap();
        snapshot.put("lead", snapshotLead(lead));
        snapshot.put("contacto", snapshotContacto(lead.getContacto()));
        snapshot.put("datosPreventa", snapshotDatos(lead.getDatosPreventa()));
        snapshot.put("direccion", snapshotDireccion(lead.getDireccion()));
        snapshot.put("eventos", eventoRepository.findAllByIdLeadOrderByCreatedAtAscIdAsc(lead.getId()).stream()
                .map(this::snapshotEvento).toList());
        snapshot.put("resumenes", resumenRepository.findByIdLead(lead.getId()).stream()
                .map(this::snapshotResumen).toList());
        CalendarioFacturacionPostventa calendario = calendarioRepository.findByLeadId(lead.getId()).orElse(null);
        snapshot.put("calendario", snapshotCalendario(calendario));
        snapshot.put("periodos", periodoRepository.findByLeadIdOrderByNumeroPeriodoAsc(lead.getId()).stream()
                .map(this::snapshotPeriodo).toList());
        snapshot.put("pagos", pagoRepository.findAllByLeadId(lead.getId()).stream().map(this::snapshotPago).toList());
        snapshot.put("encuestas", encuestaRepository.findByLeadId(lead.getId()).stream().map(this::snapshotEncuesta).toList());
        List<EntregaCredencialPlataforma> entregas = entregaRepository.findByLeadIdOrderByCreatedAtDesc(lead.getId());
        snapshot.put("entregasCredenciales", entregas.stream().map(this::snapshotEntrega).toList());
        return snapshot;
    }

    private Map<String, Object> snapshotLead(Lead l) {
        if (l == null) return null;
        List<Map<String, Object>> adicionales = l.getAdicionales() == null ? List.of() : l.getAdicionales().stream()
                .map(a -> mapOf(
                        "id", a.getId(),
                        "idAdicional", a.getAdicional() == null ? null : a.getAdicional().getId(),
                        "nombreAdicional", a.getAdicional() == null ? null : a.getAdicional().getNombre(),
                        "cantidad", a.getCantidad(),
                        "precioUnitario", a.getPrecioUnitario(),
                        "subtotal", a.getSubtotal()))
                .toList();
        return mapOf(
                "id", l.getId(), "prefijo", l.getPrefijo(), "lead", l.getLead(), "numeroParaLlamar", l.getNumeroParaLlamar(),
                "usermeta", l.getUsermeta(), "idContacto", l.getContacto() == null ? null : l.getContacto().getId(),
                "idEquipo", l.getIdEquipo(), "etapa", l.getEtapa(), "estado", l.getEstado(),
                "idAsesorAsignado", l.getIdAsesorAsignado(), "nombreAsesorAsignado", l.getNombreAsesorAsignado(),
                "requiereAtencionGtr", l.isRequiereAtencionGtr(),
                "idCampana", l.getCampana() == null ? null : l.getCampana().getId(), "base", l.getBase(),
                "idTipificacion", l.getIdTipificacion(), "codigoTipificacion", l.getCodigoTipificacion(),
                "idSubtipificacion", l.getIdSubtipificacion(), "codigoSubtipificacion", l.getCodigoSubtipificacion(),
                "numeroDocumentoTitularServicioSnapshot", l.getNumeroDocumentoTitularServicioSnapshot(),
                "direccionSnapshot", l.getDireccionSnapshot(),
                "idPlan", l.getPlan() == null ? null : l.getPlan().getId(), "nombrePlanSnapshot", l.getNombrePlanSnapshot(),
                "nombreProveedorSnapshot", l.getNombreProveedorSnapshot(), "precioPlanSnapshot", l.getPrecioPlanSnapshot(),
                "idPromocionInterna", l.getPromocionInterna() == null ? null : l.getPromocionInterna().getId(),
                "nombrePromocionInternaSnapshot", l.getNombrePromocionInternaSnapshot(),
                "idPlataformaDigitalOfrecida", l.getPlataformaDigitalOfrecida() == null
                        ? null : l.getPlataformaDigitalOfrecida().getId(),
                "adicionales", adicionales, "precioAdicionalesSnapshot", l.getPrecioAdicionalesSnapshot(),
                "precioFinal", l.getPrecioFinal(), "sec", l.getSec(), "sot", l.getSot(), "customerId", l.getCustomerId(),
                "diaCorteFacturacion", l.getDiaCorteFacturacion(), "mesesPermanenciaSnapshot", l.getMesesPermanenciaSnapshot(),
                "estadoClientePostventa", l.getEstadoClientePostventa(), "createdAt", l.getCreatedAt(),
                "lastEntryAt", l.getLastEntryAt(), "updatedAt", l.getUpdatedAt());
    }

    private Map<String, Object> snapshotContacto(Contacto c) {
        if (c == null) return null;
        return mapOf("id", c.getId(), "prefijo", c.getPrefijo(), "lead", c.getLead(), "usermeta", c.getUsermeta(),
                "nombreConocido", c.getNombreConocido(), "createdAt", c.getCreatedAt(), "updatedAt", c.getUpdatedAt());
    }

    private Map<String, Object> snapshotDatos(DatosPreventa d) {
        if (d == null) return null;
        return mapOf("id", d.getId(), "tipoDocumento", d.getTipoDocumento(),
                "numeroDocumentoTitularServicio", d.getNumeroDocumentoTitularServicio(), "ubigeoNacimiento", d.getUbigeoNacimiento(),
                "nombreTitularServicio", d.getNombreTitularServicio(), "celularRegistro", d.getCelularRegistro(),
                "celularReferencia", d.getCelularReferencia(), "correo", d.getCorreo(), "fechaNacimiento", d.getFechaNacimiento(),
                "parentesco", d.getParentesco(), "nombreMadre", d.getNombreMadre(), "nombrePadre", d.getNombrePadre(),
                "numeroDocumentoTitularCelularRegistro", d.getNumeroDocumentoTitularCelularRegistro(),
                "nombreTitularCelularRegistro", d.getNombreTitularCelularRegistro());
    }

    private Map<String, Object> snapshotDireccion(Direccion d) {
        if (d == null) return null;
        return mapOf("id", d.getId(), "ubigeoDomicilio", d.getUbigeoDomicilio(), "tipoDomicilio", d.getTipoDomicilio(),
                "tipoVia", d.getTipoVia(), "via", d.getVia(), "direccion", d.getDireccion(), "referencia", d.getReferencia(),
                "latitud", d.getLatitud(), "longitud", d.getLongitud(), "urbanizacion", d.getUrbanizacion(),
                "numero", d.getNumero(), "manzana", d.getManzana(), "lote", d.getLote(), "nombreEdificio", d.getNombreEdificio(),
                "nombreCondominio", d.getNombreCondominio(), "plano", d.getPlano(), "piso", d.getPiso(), "interior", d.getInterior());
    }

    private Map<String, Object> snapshotEvento(Evento e) {
        return mapOf("id", e.getId(), "idLead", e.getIdLead(), "idCampana", e.getIdCampana(), "idActor", e.getIdActor(),
                "nombreActor", e.getNombreActor(), "rolActor", e.getRolActor(), "idAsesorAsignado", e.getIdAsesorAsignado(),
                "nombreAsesorAsignado", e.getNombreAsesorAsignado(), "idPlanOfrecido", e.getIdPlanOfrecido(),
                "accion", e.getAccion(), "etapa", e.getEtapa(), "tipificacion", e.getTipificacion(),
                "subtipificacion", e.getSubtipificacion(), "fechaInstalacion", e.getFechaInstalacion(),
                "fechaProgramacion", e.getFechaProgramacion(), "fechaRechazo", e.getFechaRechazo(),
                "comentario", e.getComentario(), "horaProgramada", e.getHoraProgramada(), "createdAt", e.getCreatedAt());
    }

    private Map<String, Object> snapshotResumen(LeadEtapaResumen r) {
        return mapOf("id", r.getId(), "etapa", r.getEtapa(), "fechaIngresoEtapa", r.getFechaIngresoEtapa(),
                "fechaSalidaEtapa", r.getFechaSalidaEtapa(), "numeroPasadas", r.getNumeroPasadas(),
                "totalTipificaciones", r.getTotalTipificaciones(), "totalAsignaciones", r.getTotalAsignaciones(),
                "primeraCodigoTipificacion", r.getPrimeraCodigoTipificacion(), "primeraCodigoSubtipificacion", r.getPrimeraCodigoSubtipificacion(),
                "primeraTipificacionOrden", r.getPrimeraTipificacionOrden(), "primeraTipificacionAt", r.getPrimeraTipificacionAt(),
                "ultimaCodigoTipificacion", r.getUltimaCodigoTipificacion(), "ultimaCodigoSubtipificacion", r.getUltimaCodigoSubtipificacion(),
                "ultimaTipificacionOrden", r.getUltimaTipificacionOrden(), "ultimaTipificacionAt", r.getUltimaTipificacionAt(),
                "mayorRangoCodigoTipificacion", r.getMayorRangoCodigoTipificacion(),
                "mayorRangoCodigoSubtipificacion", r.getMayorRangoCodigoSubtipificacion(), "mayorRangoOrden", r.getMayorRangoOrden(),
                "mayorRangoAt", r.getMayorRangoAt(), "idAsesorMerito", r.getIdAsesorMerito(),
                "nombreAsesorMerito", r.getNombreAsesorMerito(), "fechaMerito", r.getFechaMerito(),
                "idAsesorUltimaGestion", r.getIdAsesorUltimaGestion(), "nombreAsesorUltimaGestion", r.getNombreAsesorUltimaGestion(),
                "fechaUltimaGestion", r.getFechaUltimaGestion(), "createdAt", r.getCreatedAt(), "updatedAt", r.getUpdatedAt());
    }

    private Map<String, Object> snapshotCalendario(CalendarioFacturacionPostventa c) {
        if (c == null) return null;
        return mapOf("id", c.getId(), "fechaInstalacion", c.getFechaInstalacion(), "proveedorSnapshot", c.getProveedorSnapshot(),
                "planSnapshot", c.getPlanSnapshot(), "mesesPermanenciaSnapshot", c.getMesesPermanenciaSnapshot(),
                "montoPlanSnapshot", c.getMontoPlanSnapshot(), "tipoReglaProveedor", c.getTipoReglaProveedor(),
                "diaCorte", c.getDiaCorte(), "diaEmisionEstimado", c.getDiaEmisionEstimado(), "diaVencimiento", c.getDiaVencimiento(),
                "mesCorteBase", c.getMesCorteBase(), "numeroCorteBase", c.getNumeroCorteBase(), "bloqueFacturacion", c.getBloqueFacturacion(),
                "requiereProrrateoInicial", c.getRequiereProrrateoInicial(), "activo", c.getActivo(), "observacion", c.getObservacion(),
                "createdAt", c.getCreatedAt(), "updatedAt", c.getUpdatedAt());
    }

    private Map<String, Object> snapshotPeriodo(PeriodoFacturacionPostventa p) {
        return mapOf("id", p.getId(), "numeroPeriodo", p.getNumeroPeriodo(), "fechaInicioPeriodo", p.getFechaInicioPeriodo(),
                "fechaFinPeriodo", p.getFechaFinPeriodo(), "fechaCorteEstimada", p.getFechaCorteEstimada(),
                "fechaEmisionEstimada", p.getFechaEmisionEstimada(), "fechaEmisionConfirmada", p.getFechaEmisionConfirmada(),
                "fechaVencimientoEstimado", p.getFechaVencimientoEstimado(), "fechaVencimientoConfirmado", p.getFechaVencimientoConfirmado(),
                "montoEsperado", p.getMontoEsperado(), "montoProrrateo", p.getMontoProrrateo(), "montoFacturado", p.getMontoFacturado(),
                "estado", p.getEstado(), "observacion", p.getObservacion(), "createdAt", p.getCreatedAt(), "updatedAt", p.getUpdatedAt());
    }

    private Map<String, Object> snapshotPago(PagoPostventa p) {
        return mapOf("id", p.getId(), "idPeriodo", p.getPeriodoFacturacionPostventa() == null ? null : p.getPeriodoFacturacionPostventa().getId(),
                "aportante", p.getAportante(), "estado", p.getEstado(), "condicion", p.getCondicion(), "monto", p.getMonto(),
                "fechaPago", p.getFechaPago(), "fechaCompromisoPago", p.getFechaCompromisoPago(), "numeroOperacion", p.getNumeroOperacion(),
                "observacion", p.getObservacion(), "createdAt", p.getCreatedAt(), "updatedAt", p.getUpdatedAt());
    }

    private Map<String, Object> snapshotEncuesta(EncuestaPostventa e) {
        return mapOf("id", e.getId(), "idPeriodo", e.getPeriodoFacturacionPostventa() == null ? null : e.getPeriodoFacturacionPostventa().getId(),
                "tipoEncuesta", e.getTipoEncuesta(), "tipoContacto", e.getTipoContacto(), "calificacion", e.getCalificacion(),
                "status", e.getStatus(), "estado", e.getEstado(), "prioridad", e.getPrioridad(), "fechaProgramada", e.getFechaProgramada(),
                "fechaLimite", e.getFechaLimite(), "fechaRealizada", e.getFechaRealizada(), "numeroEncuesta", e.getNumeroEncuesta(),
                "comentario", e.getComentario(), "idAsesorEncuesta", e.getIdAsesorEncuesta(),
                "nombreAsesorEncuesta", e.getNombreAsesorEncuesta(), "createdAt", e.getCreatedAt(), "updatedAt", e.getUpdatedAt());
    }

    private Map<String, Object> snapshotEntrega(EntregaCredencialPlataforma e) {
        List<Map<String, Object>> dispositivos = dispositivoRepository.findByEntregaCredencialId(e.getId()).stream()
                .map(d -> mapOf("id", d.getId(), "tipoDispositivo", d.getTipoDispositivo(),
                        "idMarca", d.getMarcaDispositivo() == null ? null : d.getMarcaDispositivo().getId(),
                        "descripcion", d.getDescripcion(), "createdAt", d.getCreatedAt(), "updatedAt", d.getUpdatedAt()))
                .toList();
        return mapOf("id", e.getId(), "idCredencial", e.getCredencial() == null ? null : e.getCredencial().getId(),
                "cantidadUsuariosAsignados", e.getCantidadUsuariosAsignados(), "esObsequio", e.getEsObsequio(), "montoVenta", e.getMontoVenta(),
                "fechaEntrega", e.getFechaEntrega(), "fechaInicioAcceso", e.getFechaInicioAcceso(), "fechaFinAcceso", e.getFechaFinAcceso(),
                "estado", e.getEstado(), "idAsesorEntrega", e.getIdAsesorEntrega(), "nombreAsesorEntrega", e.getNombreAsesorEntrega(),
                "observacion", e.getObservacion(), "createdAt", e.getCreatedAt(), "updatedAt", e.getUpdatedAt(), "dispositivos", dispositivos);
    }

    private String serializar(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("No se pudo construir el snapshot de auditoria", e);
        }
    }

    private SubsanacionResponse toResponse(SubsanacionAuditoria a) {
        return SubsanacionResponse.builder()
                .idSubsanacion(a.getId()).requestId(a.getRequestId()).idLead(a.getIdLead()).modo(a.getModo())
                .idAdmin(a.getIdAdmin()).nombreAdmin(a.getNombreAdmin()).rolAdmin(a.getRolAdmin())
                .etapaFinal(Etapa.POSTVENTA).fechaGestion(a.getFechaGestion()).fechaInstalacion(a.getFechaInstalacion())
                .ejecutadoAt(a.getEjecutadoAt()).motivo(a.getMotivo())
                .eventosReemplazados(a.getEventosReemplazados()).resumenesReemplazados(a.getResumenesReemplazados())
                .artefactosPostventaReemplazados(a.getArtefactosPostventaReemplazados())
                .oportunidadesHermanasAfectadas(a.getOportunidadesHermanasAfectadas())
                .snapshotAnterior(a.getSnapshotAnterior()).snapshotResultado(a.getSnapshotResultado())
                .lineaTiempo(List.of(
                        new SubsanacionResponse.Hito(Accion.SUBSANACION, Etapa.PREVENTA, at(a.getFechaGestion(), 9, 0)),
                        new SubsanacionResponse.Hito(Accion.REGISTRO, Etapa.PREVENTA, at(a.getFechaGestion(), 9, 1)),
                        new SubsanacionResponse.Hito(Accion.ASIGNACION, Etapa.PREVENTA, at(a.getFechaGestion(), 9, 2)),
                        new SubsanacionResponse.Hito(Accion.TIPIFICACION, Etapa.PREVENTA, at(a.getFechaGestion(), 9, 3)),
                        new SubsanacionResponse.Hito(Accion.TIPIFICACION, Etapa.VENTA, at(a.getFechaGestion(), 9, 4))))
                .build();
    }

    private Instant at(LocalDate fecha, int hora, int minuto) {
        return fecha.atTime(hora, minuto).atZone(OperationalDateTime.ZONE).toInstant();
    }

    private String normalizarPatron(String buscar) {
        if (buscar == null) return null;
        String limpio = buscar.trim();
        while (limpio.startsWith("@")) limpio = limpio.substring(1);
        return limpio.isBlank() ? null : "%" + limpio.toLowerCase(Locale.ROOT) + "%";
    }

    private String normalizarUsermeta(String value) {
        if (value == null) return null;
        String limpio = value.trim();
        while (limpio.startsWith("@")) limpio = limpio.substring(1);
        return limpio.isBlank() ? null : limpio;
    }

    private String normalizarTexto(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private LinkedHashMap<String, Object> linkedMap() {
        return new LinkedHashMap<>();
    }

    private Map<String, Object> mapOf(Object... values) {
        LinkedHashMap<String, Object> map = linkedMap();
        for (int i = 0; i < values.length; i += 2) {
            map.put((String) values[i], values[i + 1]);
        }
        return map;
    }

    private record Matriz(Tipificacion tipificacion, Subtipificacion subtipificacion) { }
    private record Contexto(Campana campana, Plan plan, Matriz preventa, Matriz venta) { }

    private record Impacto(
            int eventos,
            int resumenes,
            int calendarios,
            int periodos,
            int pagos,
            int encuestas,
            int entregas,
            int dispositivos
    ) {
        static Impacto vacio() {
            return new Impacto(0, 0, 0, 0, 0, 0, 0, 0);
        }

        int artefactosPostventa() {
            return calendarios + periodos + pagos + encuestas + entregas + dispositivos;
        }
    }
}
