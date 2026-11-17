package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.ModoFechaMasivo;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.SupervisorHistoricosEquipoMasivoRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorHistoricosEquipoMasivoResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorHistoricosEquipoResultadoResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.BusinessException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.exception.UnauthorizedException;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SupervisorHistoricosService {

    private final MasivoService masivoService;
    private final ProveedorScopeService proveedorScopeService;
    private final ProveedorRepository proveedorRepository;
    private final EquipoProveedorRepository equipoProveedorRepository;
    private final LeadRepository leadRepository;
    private final AuthEquipoClient authEquipoClient;
    private final TransactionTemplate transactionTemplate;
    private final LeadRealtimeNotifier leadRealtimeNotifier;

    public PageResponse<LeadGtrResponse> listarLeads(
            List<String> codigosTipificacion,
            List<String> codigosSubtipificacion,
            CampoTipificacion campoTipificacion,
            ModoFechaMasivo modoFecha,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            TipoGrupoGtr tipoGrupo,
            EstadoSeguimiento estadoGrupo,
            String codigoTipificacion,
            String codigoSubtipificacion,
            LocalDate fechaIngreso,
            boolean sinValor,
            Long idEquipo,
            PageRequest pageRequest
    ) {
        resolverProveedorActivo();
        return masivoService.listarLeadsSupervisor(
                codigosTipificacion, codigosSubtipificacion, campoTipificacion, modoFecha,
                fechaDesde, fechaHasta, tipoGrupo, estadoGrupo, codigoTipificacion,
                codigoSubtipificacion, fechaIngreso, sinValor, idEquipo, pageRequest
        );
    }

    public LeadGtrAgrupacionesResponse listarAgrupaciones(
            List<String> codigosTipificacion,
            List<String> codigosSubtipificacion,
            CampoTipificacion campoTipificacion,
            ModoFechaMasivo modoFecha,
            LocalDate fechaDesde,
            LocalDate fechaHasta,
            Long idEquipo
    ) {
        resolverProveedorActivo();
        return masivoService.listarAgrupacionesSupervisor(
                codigosTipificacion, codigosSubtipificacion, campoTipificacion, modoFecha,
                fechaDesde, fechaHasta, idEquipo
        );
    }

    public SupervisorHistoricosEquipoMasivoResponse moverLeads(
            SupervisorHistoricosEquipoMasivoRequest request
    ) {
        List<Long> ids = normalizarIds(request == null ? null : request.getIdsLead());
        Long idEquipoDestino = request == null ? null : request.getIdEquipo();
        validarEquipoDestino(idEquipoDestino);
        Proveedor proveedorActivo = resolverProveedorActivo();
        if (!equipoProveedorRepository.existsByIdEquipoAndProveedorId(idEquipoDestino, proveedorActivo.getId())) {
            throw new BadRequestException("El equipo destino no trabaja con el proveedor activo");
        }

        List<SupervisorHistoricosEquipoResultadoResponse> resultados = new ArrayList<>();
        for (Long idLead : ids) {
            try {
                resultados.add(moverLeadIndependiente(idLead, idEquipoDestino, proveedorActivo.getId()));
            } catch (BusinessException ex) {
                resultados.add(error(idLead, ex.getMessage()));
            } catch (Exception ex) {
                resultados.add(error(idLead, "No se pudo mover el lead"));
            }
        }

        long movidos = resultados.stream().filter(SupervisorHistoricosEquipoResultadoResponse::movido).count();
        long fallidos = resultados.stream().filter(item -> "ERROR".equals(item.operacion())).count();
        return SupervisorHistoricosEquipoMasivoResponse.builder()
                .totalSolicitados(ids.size())
                .totalProcesados(resultados.size())
                .totalMovidos((int) movidos)
                .totalFallidos((int) fallidos)
                .resultados(resultados)
                .build();
    }

    private SupervisorHistoricosEquipoResultadoResponse moverLeadIndependiente(
            Long idLead,
            Long idEquipoDestino,
            Long idProveedorActivo
    ) {
        TransactionTemplate transaction = new TransactionTemplate(transactionTemplate.getTransactionManager());
        transaction.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
        return transaction.execute(status -> moverLeadBloqueado(idLead, idEquipoDestino, idProveedorActivo));
    }

    private SupervisorHistoricosEquipoResultadoResponse moverLeadBloqueado(
            Long idLead,
            Long idEquipoDestino,
            Long idProveedorActivo
    ) {
        Lead lead = leadRepository.buscarPorIdConBloqueo(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        if (lead.getEtapa() != Etapa.PREVENTA) {
            throw new BadRequestException("El lead no pertenece a PREVENTA");
        }
        if (lead.getProveedorOrigen() == null) {
            throw new BadRequestException("El lead no tiene un proveedor de origen determinable");
        }
        if (!idProveedorActivo.equals(lead.getProveedorOrigen().getId())) {
            throw new UnauthorizedException("No tienes acceso al proveedor del lead");
        }

        Long equipoAnterior = lead.getIdEquipo();
        if (idEquipoDestino.equals(equipoAnterior)) {
            return resultado(idLead, false, "SIN_CAMBIO", equipoAnterior, idEquipoDestino,
                    "El lead ya pertenece al equipo destino");
        }

        lead.setIdEquipo(idEquipoDestino);
        lead.setIdAsesorAsignado(null);
        lead.setNombreAsesorAsignado(null);
        lead.setEsDerivado(false);
        lead.setIdTipificacion(null);
        lead.setCodigoTipificacion(null);
        lead.setIdSubtipificacion(null);
        lead.setCodigoSubtipificacion(null);
        lead.setEstado(EstadoSeguimiento.NUEVO);
        lead.setLastEntryAt(OperationalDateTime.now());
        Lead savedLead = leadRepository.save(lead);
        leadRealtimeNotifier.publishAfterCommit(pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent.builder()
                .tipo("ASIGNACION")
                .idLead(savedLead.getId())
                .etapa(savedLead.getEtapa())
                .estado(savedLead.getEstado())
                .idAsesorAsignado(null)
                .codigoTipificacion(null)
                .codigoSubtipificacion(null)
                .occurredAt(OperationalDateTime.now())
                .build());

        return resultado(idLead, true, "MOVIDO", equipoAnterior, idEquipoDestino,
                "Lead movido correctamente");
    }

    private Proveedor resolverProveedorActivo() {
        if (proveedorScopeService.ambitoActual() != AmbitoProveedor.PREVENTA) {
            throw new UnauthorizedException("El usuario no tiene un ámbito PREVENTA");
        }
        ProveedorScopeService.Scope scope = proveedorScopeService.resolverScope(AmbitoProveedor.PREVENTA);
        if (scope.proveedorIds().size() != 1) {
            throw new BadRequestException("Selecciona un proveedor activo antes de consultar historicos");
        }
        Long idProveedor = scope.proveedorIds().iterator().next();
        return proveedorRepository.findByIdAndActivoTrue(idProveedor)
                .orElseThrow(() -> new BadRequestException("El proveedor activo no existe o está inactivo"));
    }

    private void validarEquipoDestino(Long idEquipo) {
        if (idEquipo == null || idEquipo <= 0) {
            throw new BadRequestException("Selecciona un equipo destino válido");
        }
        boolean activo = authEquipoClient.listarEquiposCatalogo().stream()
                .anyMatch(equipo -> idEquipo.equals(equipo.id()) && Boolean.TRUE.equals(equipo.activo()));
        if (!activo) {
            throw new BadRequestException("El equipo destino no está activo o no existe");
        }
    }

    private List<Long> normalizarIds(List<Long> idsLead) {
        if (idsLead == null || idsLead.isEmpty()) {
            throw new BadRequestException("Debe enviar al menos un lead para mover");
        }
        if (idsLead.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new BadRequestException("Cada idLead debe ser un número válido");
        }
        if (new HashSet<>(idsLead).size() != idsLead.size()) {
            throw new BadRequestException("La lista de leads no debe contener duplicados");
        }
        return List.copyOf(idsLead);
    }

    private SupervisorHistoricosEquipoResultadoResponse resultado(
            Long idLead,
            boolean movido,
            String operacion,
            Long equipoAnterior,
            Long equipoDestino,
            String mensaje
    ) {
        return SupervisorHistoricosEquipoResultadoResponse.builder()
                .idLead(idLead)
                .movido(movido)
                .operacion(operacion)
                .idEquipoAnterior(equipoAnterior)
                .idEquipoDestino(equipoDestino)
                .mensaje(mensaje)
                .build();
    }

    private SupervisorHistoricosEquipoResultadoResponse error(Long idLead, String mensaje) {
        return resultado(idLead, false, "ERROR", null, null,
                mensaje == null || mensaje.isBlank() ? "No se pudo mover el lead" : mensaje);
    }
}
