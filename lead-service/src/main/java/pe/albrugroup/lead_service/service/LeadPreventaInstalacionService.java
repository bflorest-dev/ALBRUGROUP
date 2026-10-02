package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoCumplimientoSemana;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadPreventaInstalacionAsesorResponse;
import pe.albrugroup.lead_service.entity.response.LeadPreventaInstalacionReporteResponse;
import pe.albrugroup.lead_service.entity.response.LeadPreventaInstalacionResponse;
import pe.albrugroup.lead_service.entity.response.LeadPreventaInstalacionTotalesResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ForbiddenException;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.projection.LeadPreventaInstalacionProjection;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeadPreventaInstalacionService {

    private final LeadRepository leadRepository;
    private final CurrentUser currentUser;
    private final EquipoProveedorService equipoProveedorService;

    @Transactional(readOnly = true)
    public LeadPreventaInstalacionReporteResponse listar(
            LocalDate fechaPreventaDesde,
            LocalDate fechaPreventaHasta,
            LocalDate fechaInstalacionDesde,
            LocalDate fechaInstalacionHasta,
            Long idProveedor,
            Long idAsesorPreventa,
            EstadoClientePostventa estadoPostventa,
            boolean sinEstadoPostventa,
            Boolean cumpleMismaSemana,
            EstadoCumplimientoSemana estadoCumplimientoSemana,
            PageRequest pageRequest
    ) {
        validarRango("Preventa", fechaPreventaDesde, fechaPreventaHasta);
        validarRango("Instalacion", fechaInstalacionDesde, fechaInstalacionHasta);

        Instant preventaDesde = OperationalDateTime.startOfDay(fechaPreventaDesde);
        Instant preventaHasta = OperationalDateTime.endExclusiveOfDay(fechaPreventaHasta);
        Long proveedorResuelto = resolverProveedor(idProveedor);
        List<LeadPreventaInstalacionResponse> filas = leadRepository.listarLeadsPreventaInstalacion(
                        Etapa.PREVENTA,
                        preventaDesde,
                        preventaHasta,
                        fechaInstalacionDesde,
                        fechaInstalacionHasta,
                        proveedorResuelto,
                        idAsesorPreventa,
                        estadoPostventa,
                        sinEstadoPostventa
                ).stream()
                .map(this::mapear)
                .filter(fila -> cumpleMismaSemana == null
                        || Objects.equals(fila.getCumpleMismaSemana(), cumpleMismaSemana))
                .filter(fila -> estadoCumplimientoSemana == null
                        || fila.getEstadoCumplimientoSemana() == estadoCumplimientoSemana)
                .sorted(comparador(pageRequest))
                .toList();

        PageResponse<LeadPreventaInstalacionResponse> detalle = paginar(filas, pageRequest);
        return LeadPreventaInstalacionReporteResponse.builder()
                .detalle(detalle)
                .porAsesor(resumirPorAsesor(filas))
                .totales(resumirTotales(filas))
                .build();
    }

    private Long resolverProveedor(Long idProveedor) {
        List<String> roles = currentUser.roles();
        boolean supervisorAcotado = roles != null
                && roles.contains("SUPERVISOR_VENTAS")
                && !currentUser.tieneVisibilidadGlobalEquipos();
        if (!supervisorAcotado) {
            return idProveedor;
        }

        Set<Long> visibles = equipoProveedorService.proveedorIdsVisibles();
        if (visibles == null) {
            return idProveedor;
        }
        if (idProveedor != null && !visibles.contains(idProveedor)) {
            throw new ForbiddenException("No tienes acceso al proveedor seleccionado", idProveedor);
        }
        if (idProveedor != null) {
            return idProveedor;
        }
        if (visibles.size() != 1) {
            throw new BadRequestException("No se pudo resolver el proveedor del equipo");
        }
        return visibles.iterator().next();
    }

    private LeadPreventaInstalacionResponse mapear(LeadPreventaInstalacionProjection row) {
        LocalDate fechaPreventa = row.getFechaPreventa()
                .atZone(OperationalDateTime.ZONE)
                .toLocalDate();
        LocalDate fechaInstalacion = row.getFechaInstalacion();
        Semana semanaPreventa = semana(fechaPreventa, row.getReglaSemanaProveedor());
        Semana semanaInstalacion = fechaInstalacion == null
                ? null
                : semana(fechaInstalacion, row.getReglaSemanaProveedor());

        EstadoCumplimientoSemana estado;
        Boolean cumple = null;
        if (fechaInstalacion == null) {
            estado = EstadoCumplimientoSemana.PENDIENTE_INSTALACION;
        } else if (semanaPreventa == null || semanaInstalacion == null) {
            estado = EstadoCumplimientoSemana.NO_EVALUABLE;
        } else if (fechaInstalacion.isBefore(fechaPreventa)) {
            estado = EstadoCumplimientoSemana.NO_CUMPLE;
            cumple = false;
        } else {
            cumple = semanaPreventa.inicio().equals(semanaInstalacion.inicio());
            estado = cumple
                    ? EstadoCumplimientoSemana.CUMPLE
                    : EstadoCumplimientoSemana.NO_CUMPLE;
        }

        return LeadPreventaInstalacionResponse.builder()
                .idLead(row.getIdLead())
                .prefijo(row.getPrefijo())
                .lead(row.getLead())
                .tipoDocumento(row.getTipoDocumento())
                .numeroDocumento(row.getNumeroDocumento())
                .nombreCliente(row.getNombreCliente())
                .departamento(row.getDepartamento())
                .idAsesorPreventa(row.getIdAsesorPreventa())
                .nombreAsesorPreventa(row.getNombreAsesorPreventa())
                .idProveedor(row.getIdProveedor())
                .proveedor(row.getProveedor())
                .reglaSemanaProveedor(row.getReglaSemanaProveedor())
                .fechaPreventa(fechaPreventa)
                .fechaInstalacion(fechaInstalacion)
                .estadoPostventa(row.getEstadoPostventa())
                .etapaActual(row.getEtapaActual())
                .cumpleMismaSemana(cumple)
                .estadoCumplimientoSemana(estado)
                .diasEntrePreventaEInstalacion(fechaInstalacion == null
                        ? null
                        : ChronoUnit.DAYS.between(fechaPreventa, fechaInstalacion))
                .semanaPreventaInicio(semanaPreventa == null ? null : semanaPreventa.inicio())
                .semanaPreventaFin(semanaPreventa == null ? null : semanaPreventa.fin())
                .semanaInstalacionInicio(semanaInstalacion == null ? null : semanaInstalacion.inicio())
                .semanaInstalacionFin(semanaInstalacion == null ? null : semanaInstalacion.fin())
                .build();
    }

    private Semana semana(LocalDate fecha, TipoReglaFacturacion regla) {
        if (regla == null) {
            return null;
        }
        DayOfWeek inicio = switch (regla) {
            case WIN -> DayOfWeek.SATURDAY;
            case CLARO -> DayOfWeek.FRIDAY;
            case PERSONALIZADA -> null;
        };
        if (inicio == null) {
            return null;
        }
        int diasDesdeInicio = (fecha.getDayOfWeek().getValue() - inicio.getValue() + 7) % 7;
        LocalDate desde = fecha.minusDays(diasDesdeInicio);
        return new Semana(desde, desde.plusDays(6));
    }

    private Comparator<LeadPreventaInstalacionResponse> comparador(PageRequest pageRequest) {
        String sortBy = pageRequest == null || pageRequest.getSortBy() == null
                ? "fechaPreventa" : pageRequest.getSortBy();
        Comparator<LeadPreventaInstalacionResponse> comparator = switch (sortBy) {
            case "fechaInstalacion" -> Comparator.comparing(
                    LeadPreventaInstalacionResponse::getFechaInstalacion,
                    Comparator.nullsLast(Comparator.naturalOrder()));
            case "nombreAsesorPreventa" -> Comparator.comparing(
                    LeadPreventaInstalacionResponse::getNombreAsesorPreventa,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "proveedor" -> Comparator.comparing(
                    LeadPreventaInstalacionResponse::getProveedor,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "nombreCliente" -> Comparator.comparing(
                    LeadPreventaInstalacionResponse::getNombreCliente,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            case "lead" -> Comparator.comparing(
                    LeadPreventaInstalacionResponse::getLead,
                    Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
            default -> Comparator.comparing(
                    LeadPreventaInstalacionResponse::getFechaPreventa,
                    Comparator.nullsLast(Comparator.naturalOrder()));
        };
        if (pageRequest != null && "desc".equalsIgnoreCase(pageRequest.getDirection())) {
            comparator = comparator.reversed();
        }
        return comparator.thenComparing(LeadPreventaInstalacionResponse::getIdLead);
    }

    private PageResponse<LeadPreventaInstalacionResponse> paginar(
            List<LeadPreventaInstalacionResponse> filas,
            PageRequest pageRequest
    ) {
        int page = pageRequest == null ? 0 : pageRequest.getPageNumber();
        int size = pageRequest == null ? 25 : pageRequest.getPageSize();
        if (size < 1 || size > 100) {
            throw new BadRequestException("pageSize debe estar entre 1 y 100");
        }
        long inicioLong = (long) page * size;
        int inicio = inicioLong >= filas.size() ? filas.size() : (int) inicioLong;
        int fin = Math.min(inicio + size, filas.size());
        int totalPages = filas.isEmpty() ? 0 : (int) Math.ceil((double) filas.size() / size);
        return PageResponse.<LeadPreventaInstalacionResponse>builder()
                .page(page)
                .size(size)
                .totalPages(totalPages)
                .totalElements(filas.size())
                .content(filas.subList(inicio, fin))
                .build();
    }

    private List<LeadPreventaInstalacionAsesorResponse> resumirPorAsesor(
            List<LeadPreventaInstalacionResponse> filas
    ) {
        Map<AsesorKey, Contadores> resumen = new LinkedHashMap<>();
        for (LeadPreventaInstalacionResponse fila : filas) {
            AsesorKey key = new AsesorKey(fila.getIdAsesorPreventa(), fila.getNombreAsesorPreventa());
            Contadores contador = resumen.computeIfAbsent(key, ignored -> new Contadores());
            contador.total++;
            if (fila.getFechaInstalacion() == null) {
                contador.pendientes++;
            } else {
                contador.instalados++;
            }
            if (Boolean.TRUE.equals(fila.getCumpleMismaSemana())) {
                contador.cumplen++;
            } else if (Boolean.FALSE.equals(fila.getCumpleMismaSemana())) {
                contador.noCumplen++;
            }
        }
        return resumen.entrySet().stream()
                .map(entry -> LeadPreventaInstalacionAsesorResponse.builder()
                        .idAsesor(entry.getKey().id())
                        .nombreAsesor(entry.getKey().nombre())
                        .totalPreventas(entry.getValue().total)
                        .instalados(entry.getValue().instalados)
                        .cumplenMismaSemana(entry.getValue().cumplen)
                        .noCumplenMismaSemana(entry.getValue().noCumplen)
                        .pendientesInstalacion(entry.getValue().pendientes)
                        .build())
                .sorted(Comparator.comparing(
                        LeadPreventaInstalacionAsesorResponse::getNombreAsesor,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    private LeadPreventaInstalacionTotalesResponse resumirTotales(
            List<LeadPreventaInstalacionResponse> filas
    ) {
        long instalados = filas.stream().filter(fila -> fila.getFechaInstalacion() != null).count();
        long pendientes = filas.stream().filter(fila -> fila.getFechaInstalacion() == null).count();
        long cumplen = filas.stream().filter(fila -> Boolean.TRUE.equals(fila.getCumpleMismaSemana())).count();
        long noCumplen = filas.stream().filter(fila -> Boolean.FALSE.equals(fila.getCumpleMismaSemana())).count();
        return LeadPreventaInstalacionTotalesResponse.builder()
                .totalPreventas(filas.size())
                .instalados(instalados)
                .cumplenMismaSemana(cumplen)
                .noCumplenMismaSemana(noCumplen)
                .pendientesInstalacion(pendientes)
                .build();
    }

    private void validarRango(String nombre, LocalDate desde, LocalDate hasta) {
        if (desde == null || hasta == null) {
            throw new BadRequestException("Las fechas de " + nombre + " son obligatorias");
        }
        if (desde.isAfter(hasta)) {
            throw new BadRequestException("La fecha inicial de " + nombre + " no puede ser posterior a la fecha final");
        }
    }

    private record Semana(LocalDate inicio, LocalDate fin) {}

    private record AsesorKey(Long id, String nombre) {}

    private static final class Contadores {
        private long total;
        private long instalados;
        private long cumplen;
        private long noCumplen;
        private long pendientes;
    }
}
