package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.DatosPreventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Plan;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.DetalleMetricaPostventaResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Collection;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DetalleMetricaPostventaService {

    private static final Set<String> MODOS = Set.of("MENSUAL", "COHORTE");
    private static final Set<String> CATEGORIAS = Set.of("TOTAL", "PAGADOS", "IMPAGOS", "BAJAS");
    private static final Set<String> ORDENES = Set.of("fechaInstalacion", "ultimaGestion");
    private static final String PROVEEDOR_POR_DEFECTO = "WIN";

    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final LeadEtapaResumenRepository resumenRepository;
    private final ProveedorScopeService proveedorScopeService;

    public PageResponse<DetalleMetricaPostventaResponse> listar(
            String modoParam,
            LocalDate mesReferencia,
            String proveedorParam,
            LocalDate mesCorteBase,
            Integer numeroCorte,
            Integer numeroRecibo,
            String categoriaParam,
            EstadoClientePostventa estadoPostventa,
            String tipificacion,
            String subtipificacion,
            String buscar,
            PageRequest pageRequest
    ) {
        if (mesReferencia == null) {
            throw new BadRequestException("El mes de referencia es obligatorio");
        }
        String modo = normalizarPermitido(modoParam, MODOS, "modo");
        String categoria = normalizarPermitido(categoriaParam, CATEGORIAS, "categoria");
        String sortBy = ORDENES.contains(pageRequest.getSortBy()) ? pageRequest.getSortBy() : "ultimaGestion";
        String direction = "asc".equalsIgnoreCase(pageRequest.getDirection()) ? "asc" : "desc";
        String proveedor = resolverProveedor(proveedorParam);
        int anioMes = mesReferencia.getYear() * 12 + mesReferencia.getMonthValue();

        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                pageRequest.getPageNumber(),
                pageRequest.getPageSize()
        );
        Page<PeriodoFacturacionPostventa> periodos = periodoRepository.detalleMetrica(
                modo,
                YearMonth.from(mesReferencia).atDay(1),
                anioMes,
                proveedor,
                mesCorteBase != null,
                mesCorteBase == null ? LocalDate.of(1970, 1, 1) : YearMonth.from(mesCorteBase).atDay(1),
                numeroCorte != null,
                numeroCorte == null ? 0 : numeroCorte,
                numeroRecibo != null,
                numeroRecibo == null ? 0 : numeroRecibo,
                categoria,
                estadoPostventa != null,
                estadoPostventa == null ? EstadoClientePostventa.ACTIVO : estadoPostventa,
                normalizarTexto(tipificacion),
                normalizarTexto(subtipificacion),
                buscar == null ? "" : buscar.trim(),
                Etapa.POSTVENTA,
                sortBy,
                direction,
                pageable
        );

        Map<Long, LeadEtapaResumen> resumenes = obtenerResumenes(periodos.getContent());
        Page<DetalleMetricaPostventaResponse> response = periodos.map(periodo ->
                toResponse(periodo, resumenes.get(periodo.getLead().getId()))
        );
        return PageResponse.from(response);
    }

    private Map<Long, LeadEtapaResumen> obtenerResumenes(Collection<PeriodoFacturacionPostventa> periodos) {
        Set<Long> leadIds = periodos.stream()
                .map(PeriodoFacturacionPostventa::getLead)
                .map(Lead::getId)
                .collect(Collectors.toSet());
        if (leadIds.isEmpty()) {
            return Map.of();
        }
        return resumenRepository.findByIdLeadInAndEtapa(leadIds, Etapa.POSTVENTA).stream()
                .collect(Collectors.toMap(LeadEtapaResumen::getIdLead, Function.identity()));
    }

    private DetalleMetricaPostventaResponse toResponse(
            PeriodoFacturacionPostventa periodo,
            LeadEtapaResumen resumen
    ) {
        Lead lead = periodo.getLead();
        DatosPreventa datos = lead.getDatosPreventa();
        Plan plan = lead.getPlan();
        var calendario = periodo.getCalendarioFacturacionPostventa();
        return DetalleMetricaPostventaResponse.builder()
                .idLead(lead.getId())
                .numeroLead(lead.getLead())
                .numeroDocumento(datos == null
                        ? lead.getNumeroDocumentoTitularServicioSnapshot()
                        : datos.getNumeroDocumentoTitularServicio())
                .nombreCliente(datos == null ? null : datos.getNombreTitularServicio())
                .fechaInstalacion(calendario.getFechaInstalacion())
                .mesCorteBase(calendario.getMesCorteBase())
                .numeroCorte(calendario.getNumeroCorteBase())
                .numeroRecibo(periodo.getNumeroPeriodo())
                .estadoPeriodo(periodo.getEstado())
                .estadoPostventa(lead.getEstadoClientePostventa() == null
                        ? EstadoClientePostventa.ACTIVO
                        : lead.getEstadoClientePostventa())
                .tipificacion(resumen == null ? null : resumen.getUltimaCodigoTipificacion())
                .subtipificacion(resumen == null ? null : resumen.getUltimaCodigoSubtipificacion())
                .ultimaGestion(resumen == null ? null : resumen.getFechaUltimaGestion())
                .asesorPostventa(resumen == null ? null : resumen.getNombreAsesorUltimaGestion())
                .proveedor(calendario.getProveedorSnapshot())
                .plan(calendario.getPlanSnapshot())
                .cargoFijo(calendario.getMontoPlanSnapshot())
                .velocidadRegular(plan == null || plan.getInternet() == null
                        ? null
                        : plan.getInternet().getVelocidad())
                .unidadVelocidad(plan == null || plan.getInternet() == null
                        ? null
                        : plan.getInternet().getUnidad())
                .build();
    }

    private String resolverProveedor(String proveedorParam) {
        if (proveedorScopeService.ambitoActual() == AmbitoProveedor.POSTVENTA) {
            Set<String> nombres = proveedorScopeService.resolverScope(AmbitoProveedor.POSTVENTA).proveedorNombres();
            if (nombres.size() == 1) {
                return nombres.iterator().next();
            }
        }
        return proveedorParam == null || proveedorParam.isBlank()
                ? PROVEEDOR_POR_DEFECTO
                : proveedorParam.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizarPermitido(String valor, Set<String> permitidos, String campo) {
        String normalizado = valor == null ? "" : valor.trim().toUpperCase(Locale.ROOT);
        if (!permitidos.contains(normalizado)) {
            throw new BadRequestException("Valor de " + campo + " no permitido");
        }
        return normalizado;
    }

    private String normalizarTexto(String valor) {
        return valor == null || valor.isBlank() ? "" : valor.trim();
    }
}
