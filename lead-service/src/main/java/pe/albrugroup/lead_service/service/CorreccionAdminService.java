package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.DatosPreventa;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.request.LeadCorreccionRequest;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.LeadCorreccionBusquedaResponse;
import pe.albrugroup.lead_service.entity.response.LeadDetalleResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Tab de correccion integral de leads (exclusiva del ADMIN, permiso {@code CORREGIR_LEAD_ADMIN}).
 * Orquesta la busqueda total, el detalle/historial sin scope de equipo, y el submit atomico de una
 * gestion de correccion: aplica ediciones (delegadas en {@link LeadService}), elimina los eventos
 * marcados y deja un unico evento {@link Accion#CORRECCION} como constancia. Todo en una transaccion.
 */
@Service
@RequiredArgsConstructor
public class CorreccionAdminService {

    private static final int LIMITE_BUSQUEDA = 50;

    private final LeadRepository leadRepository;
    private final EventoRepository eventoRepository;
    private final LeadService leadService;
    private final EventoService eventoService;
    private final CurrentUser currentUser;

    public List<LeadCorreccionBusquedaResponse> buscar(String buscar) {
        String patron = normalizarPatron(buscar);
        if (patron == null) {
            return List.of();
        }
        return leadRepository
                .buscarParaCorreccionAdmin(patron, org.springframework.data.domain.PageRequest.of(0, LIMITE_BUSQUEDA))
                .stream()
                .map(this::toBusquedaResponse)
                .toList();
    }

    public LeadDetalleResponse obtenerDetalle(Long idLead) {
        return leadService.obtenerDetalleParaCorreccion(idLead);
    }

    public PageResponse<EventoResponse> listarHistorial(
            Long idLead,
            Accion accion,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            PageRequest pageRequest
    ) {
        return eventoService.listarPorLeadSinScope(idLead, accion, fechaDesde, fechaHasta, pageRequest);
    }

    @Transactional
    public LeadDetalleResponse aplicarCorreccion(Long idLead, LeadCorreccionRequest request) {
        List<Long> idsEventos = request.getIdsEventosAEliminar() == null
                ? List.of()
                : request.getIdsEventosAEliminar().stream().filter(Objects::nonNull).distinct().toList();
        boolean hayCambiosDatos = request.getIdentidad() != null
                || request.getDatosPreventa() != null
                || request.getDireccion() != null
                || request.getOfertaComercial() != null;
        if (!hayCambiosDatos && idsEventos.isEmpty()) {
            throw new BadRequestException("No hay cambios que aplicar en la correccion");
        }

        // Aplica las ediciones (si las hay) y valida que el lead exista; devuelve el Lead para su etapa.
        Lead lead = leadService.aplicarCambiosCorreccion(
                idLead,
                request.getIdentidad(),
                request.getDatosPreventa(),
                request.getDireccion(),
                request.getOfertaComercial()
        );

        // Elimina los eventos marcados, validando pertenencia y blindando el evento CORRECCION.
        if (!idsEventos.isEmpty()) {
            List<Evento> eventos = eventoRepository.findByIdInAndIdLead(idsEventos, idLead);
            if (eventos.size() != idsEventos.size()) {
                throw new BadRequestException("Alguno de los eventos indicados no pertenece a este lead");
            }
            if (eventos.stream().anyMatch(evento -> evento.getAccion() == Accion.CORRECCION)) {
                throw new BadRequestException("Un evento de correccion no se puede eliminar");
            }
            eventoRepository.deleteAll(eventos);
        }

        // Constancia: un unico evento CORRECCION por toda la gestion de correccion.
        Evento correccion = Evento.builder()
                .idLead(idLead)
                .idActor(currentUser.empleadoID())
                .nombreActor(currentUser.nombreCompleto())
                .rolActor(currentUser.rolPrincipal())
                .accion(Accion.CORRECCION)
                .etapa(lead.getEtapa())
                .comentario(construirComentario(request, idsEventos.size()))
                .build();
        eventoRepository.save(correccion);

        return leadService.obtenerDetalleParaCorreccion(idLead);
    }

    private LeadCorreccionBusquedaResponse toBusquedaResponse(Lead lead) {
        DatosPreventa datosPreventa = lead.getDatosPreventa();
        String numeroDocumento = datosPreventa != null && datosPreventa.getNumeroDocumentoTitularServicio() != null
                ? datosPreventa.getNumeroDocumentoTitularServicio()
                : lead.getNumeroDocumentoTitularServicioSnapshot();
        String proveedor = lead.getPlan() != null && lead.getPlan().getProveedor() != null
                ? lead.getPlan().getProveedor().getNombre()
                : lead.getNombreProveedorSnapshot();
        return LeadCorreccionBusquedaResponse.builder()
                .idLead(lead.getId())
                .lead(lead.getLead())
                .usermeta(lead.getUsermeta())
                .numeroDocumento(numeroDocumento)
                .celular(datosPreventa == null ? null : datosPreventa.getCelularRegistro())
                .titularServicio(datosPreventa == null ? null : datosPreventa.getNombreTitularServicio())
                .createdAt(lead.getCreatedAt())
                .lastEntryAt(lead.getLastEntryAt())
                .etapa(lead.getEtapa())
                .codigoTipificacionActual(lead.getCodigoTipificacion())
                .codigoSubtipificacionActual(lead.getCodigoSubtipificacion())
                .idEquipo(lead.getIdEquipo())
                .nombreProveedor(proveedor)
                .build();
    }

    private String construirComentario(LeadCorreccionRequest request, int eventosEliminados) {
        StringBuilder sb = new StringBuilder();
        if (request.getResumenCambios() != null && !request.getResumenCambios().isBlank()) {
            sb.append(request.getResumenCambios().trim());
        } else {
            sb.append("Correccion integral del lead");
        }
        if (eventosEliminados > 0) {
            sb.append(" · Eventos eliminados: ").append(eventosEliminados);
        }
        if (request.getMotivo() != null && !request.getMotivo().isBlank()) {
            sb.append(" · Motivo: ").append(request.getMotivo().trim());
        }
        return sb.toString();
    }

    // Buscador total: un solo termino, case-insensitive. Acepta usermeta con '@' (se descarta) y
    // documentos/celulares/nombres. Devuelve null cuando no hay termino util.
    private String normalizarPatron(String buscar) {
        if (buscar == null) {
            return null;
        }
        String limpio = buscar.trim();
        while (limpio.startsWith("@")) {
            limpio = limpio.substring(1);
        }
        limpio = limpio.trim();
        if (limpio.isEmpty()) {
            return null;
        }
        return "%" + limpio.toLowerCase(Locale.ROOT) + "%";
    }
}
