package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Gasto;
import pe.albrugroup.lead_service.entity.GrupoGasto;
import pe.albrugroup.lead_service.entity.TipoGasto;
import pe.albrugroup.lead_service.entity.enums.CategoriaGasto;
import pe.albrugroup.lead_service.entity.request.GastoRequest;
import pe.albrugroup.lead_service.entity.request.GrupoGastoRequest;
import pe.albrugroup.lead_service.entity.request.TipoGastoRequest;
import pe.albrugroup.lead_service.entity.response.GastoResponse;
import pe.albrugroup.lead_service.entity.response.GrupoGastoResponse;
import pe.albrugroup.lead_service.entity.response.ResumenGastosMensualResponse;
import pe.albrugroup.lead_service.entity.response.ResumenGastosMensualResponse.GrupoResumen;
import pe.albrugroup.lead_service.entity.response.ResumenGastosMensualResponse.LineaGasto;
import pe.albrugroup.lead_service.entity.response.TipoGastoResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.GastoRepository;
import pe.albrugroup.lead_service.repository.GrupoGastoRepository;
import pe.albrugroup.lead_service.repository.ResumenFinancieroDiaRepository;
import pe.albrugroup.lead_service.repository.TipoGastoRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GastosGeneralesService {

    private final GrupoGastoRepository grupoRepo;
    private final TipoGastoRepository tipoRepo;
    private final GastoRepository gastoRepo;
    private final ResumenFinancieroDiaRepository resumenRepo;

    // ── Grupos ──

    @Transactional(readOnly = true)
    public List<GrupoGastoResponse> listarGrupos() {
        return grupoRepo.findAllByOrderByOrdenAscNombreAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GrupoGastoResponse crearGrupo(GrupoGastoRequest req) {
        if (grupoRepo.existsByNombreIgnoreCase(req.getNombre().trim())) {
            throw new ConflictException("Ya existe un grupo con ese nombre", req.getNombre());
        }
        GrupoGasto grupo = GrupoGasto.builder()
                .nombre(req.getNombre().trim())
                .orden(req.getOrden())
                .build();
        return toResponse(grupoRepo.save(grupo));
    }

    @Transactional
    public GrupoGastoResponse editarGrupo(Long id, GrupoGastoRequest req) {
        GrupoGasto grupo = grupoRepo.findById(id)
                .orElseThrow(() -> new NotFoundException(GrupoGasto.class, id));
        if (grupoRepo.existsByNombreIgnoreCaseAndIdNot(req.getNombre().trim(), id)) {
            throw new ConflictException("Ya existe un grupo con ese nombre", req.getNombre());
        }
        grupo.setNombre(req.getNombre().trim());
        grupo.setOrden(req.getOrden());
        return toResponse(grupoRepo.save(grupo));
    }

    @Transactional
    public void eliminarGrupo(Long id) {
        if (!grupoRepo.existsById(id)) {
            throw new NotFoundException(GrupoGasto.class, id);
        }
        if (tipoRepo.existsByGrupoGastoId(id)) {
            throw new BadRequestException("No se puede eliminar un grupo que tiene tipos de gasto asociados", id);
        }
        grupoRepo.deleteById(id);
    }

    // ── Tipos de gasto ──

    @Transactional(readOnly = true)
    public List<TipoGastoResponse> listarTipos() {
        return tipoRepo.findAllByOrderByGrupoGastoOrdenAscNombreAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TipoGastoResponse> listarTiposActivos() {
        return tipoRepo.findByActivoTrueOrderByGrupoGastoOrdenAscNombreAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public TipoGastoResponse crearTipo(TipoGastoRequest req) {
        GrupoGasto grupo = grupoRepo.findById(req.getIdGrupoGasto())
                .orElseThrow(() -> new NotFoundException(GrupoGasto.class, req.getIdGrupoGasto()));
        if (tipoRepo.existsByNombreIgnoreCase(req.getNombre().trim())) {
            throw new ConflictException("Ya existe un tipo de gasto con ese nombre", req.getNombre());
        }
        TipoGasto tipo = TipoGasto.builder()
                .grupoGasto(grupo)
                .nombre(req.getNombre().trim())
                .categoria(req.getCategoria())
                .build();
        return toResponse(tipoRepo.save(tipo));
    }

    @Transactional
    public TipoGastoResponse editarTipo(Long id, TipoGastoRequest req) {
        TipoGasto tipo = tipoRepo.findById(id)
                .orElseThrow(() -> new NotFoundException(TipoGasto.class, id));
        GrupoGasto grupo = grupoRepo.findById(req.getIdGrupoGasto())
                .orElseThrow(() -> new NotFoundException(GrupoGasto.class, req.getIdGrupoGasto()));
        if (tipoRepo.existsByNombreIgnoreCaseAndIdNot(req.getNombre().trim(), id)) {
            throw new ConflictException("Ya existe un tipo de gasto con ese nombre", req.getNombre());
        }
        tipo.setGrupoGasto(grupo);
        tipo.setNombre(req.getNombre().trim());
        tipo.setCategoria(req.getCategoria());
        return toResponse(tipoRepo.save(tipo));
    }

    @Transactional
    public TipoGastoResponse desactivarTipo(Long id) {
        TipoGasto tipo = tipoRepo.findById(id)
                .orElseThrow(() -> new NotFoundException(TipoGasto.class, id));
        tipo.setActivo(false);
        return toResponse(tipoRepo.save(tipo));
    }

    // ── Gastos ──

    @Transactional
    public GastoResponse crearGasto(GastoRequest req) {
        TipoGasto tipo = tipoRepo.findById(req.getIdTipoGasto())
                .orElseThrow(() -> new NotFoundException(TipoGasto.class, req.getIdTipoGasto()));
        Gasto gasto = Gasto.builder()
                .tipoGasto(tipo)
                .monto(req.getMonto())
                .documento(req.getDocumento())
                .descripcion(req.getDescripcion())
                .fecha(req.getFecha())
                .build();
        return toResponse(gastoRepo.save(gasto));
    }

    @Transactional(readOnly = true)
    public List<GastoResponse> listarGastos(Long idTipoGasto, LocalDate desde, LocalDate hasta) {
        if (idTipoGasto != null) {
            return gastoRepo.findByTipoGastoIdAndFechaBetweenOrderByFechaDescIdDesc(idTipoGasto, desde, hasta)
                    .stream().map(this::toResponse).toList();
        }
        return gastoRepo.findByFechaBetweenOrderByFechaDescIdDesc(desde, hasta)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public GastoResponse editarGasto(Long id, GastoRequest req) {
        Gasto gasto = gastoRepo.findById(id)
                .orElseThrow(() -> new NotFoundException(Gasto.class, id));
        TipoGasto tipo = tipoRepo.findById(req.getIdTipoGasto())
                .orElseThrow(() -> new NotFoundException(TipoGasto.class, req.getIdTipoGasto()));
        gasto.setTipoGasto(tipo);
        gasto.setMonto(req.getMonto());
        gasto.setDocumento(req.getDocumento());
        gasto.setDescripcion(req.getDescripcion());
        gasto.setFecha(req.getFecha());
        return toResponse(gastoRepo.save(gasto));
    }

    @Transactional
    public void eliminarGasto(Long id) {
        if (!gastoRepo.existsById(id)) {
            throw new NotFoundException(Gasto.class, id);
        }
        gastoRepo.deleteById(id);
    }

    // ── Resumen mensual ──

    @Transactional(readOnly = true)
    public ResumenGastosMensualResponse resumenMensual(int anio, int mes) {
        YearMonth ym = YearMonth.of(anio, mes);
        LocalDate desde = ym.atDay(1);
        LocalDate hasta = ym.atEndOfMonth();

        List<TipoGasto> todosLosTipos = tipoRepo.findByActivoTrueOrderByGrupoGastoOrdenAscNombreAsc();

        Map<Long, BigDecimal> acumulados = new HashMap<>();
        Map<Long, Integer> conteos = new HashMap<>();
        for (Object[] row : gastoRepo.acumuladoPorTipo(desde, hasta)) {
            Long idTipo = ((Number) row[0]).longValue();
            BigDecimal monto = (BigDecimal) row[1];
            int cantidad = ((Number) row[2]).intValue();
            acumulados.put(idTipo, monto);
            conteos.put(idTipo, cantidad);
        }

        Map<Long, List<LineaGasto>> porGrupo = new HashMap<>();
        BigDecimal subtotalFijos = BigDecimal.ZERO;
        BigDecimal subtotalVariables = BigDecimal.ZERO;

        for (TipoGasto tipo : todosLosTipos) {
            BigDecimal acum = acumulados.getOrDefault(tipo.getId(), BigDecimal.ZERO);
            int cant = conteos.getOrDefault(tipo.getId(), 0);

            if (acum.compareTo(BigDecimal.ZERO) == 0 && cant == 0) continue;

            Long idGrupo = tipo.getGrupoGasto().getId();
            porGrupo.computeIfAbsent(idGrupo, k -> new ArrayList<>())
                    .add(new LineaGasto(tipo.getId(), tipo.getNombre(),
                            tipo.getCategoria().name(), acum, cant));

            if (tipo.getCategoria() == CategoriaGasto.FIJO) {
                subtotalFijos = subtotalFijos.add(acum);
            } else {
                subtotalVariables = subtotalVariables.add(acum);
            }
        }

        List<GrupoGasto> grupos = grupoRepo.findAllByOrderByOrdenAscNombreAsc();
        List<GrupoResumen> grupoResumenes = new ArrayList<>();
        for (GrupoGasto g : grupos) {
            List<LineaGasto> lineas = porGrupo.getOrDefault(g.getId(), List.of());
            if (lineas.isEmpty()) continue;
            BigDecimal subtotal = lineas.stream()
                    .map(LineaGasto::acumuladoMes)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            grupoResumenes.add(new GrupoResumen(g.getId(), g.getNombre(), g.getOrden(), lineas, subtotal));
        }

        Object[] financiero = resumenRepo.acumuladoMensualGlobal(desde, hasta);
        BigDecimal ctaBancaria = BigDecimal.ZERO;
        BigDecimal ctaPublicitaria = BigDecimal.ZERO;
        BigDecimal cashbackPreventa = BigDecimal.ZERO;
        BigDecimal cashbackPostventa = BigDecimal.ZERO;
        if (financiero != null && financiero.length == 4) {
            ctaBancaria = toBigDecimal(financiero[0]);
            ctaPublicitaria = toBigDecimal(financiero[1]);
            cashbackPreventa = toBigDecimal(financiero[2]);
            cashbackPostventa = toBigDecimal(financiero[3]);
        }

        BigDecimal totalManuales = subtotalFijos.add(subtotalVariables);
        BigDecimal totalGeneral = totalManuales
                .add(ctaBancaria).add(ctaPublicitaria)
                .add(cashbackPreventa).add(cashbackPostventa);

        return new ResumenGastosMensualResponse(
                anio, mes, grupoResumenes,
                subtotalFijos, subtotalVariables,
                ctaBancaria, ctaPublicitaria,
                cashbackPreventa, cashbackPostventa,
                totalGeneral
        );
    }

    // ── Mappers ──

    private GrupoGastoResponse toResponse(GrupoGasto g) {
        return new GrupoGastoResponse(g.getId(), g.getNombre(), g.getOrden());
    }

    private TipoGastoResponse toResponse(TipoGasto t) {
        return new TipoGastoResponse(
                t.getId(),
                toResponse(t.getGrupoGasto()),
                t.getNombre(),
                t.getCategoria(),
                t.getActivo()
        );
    }

    private GastoResponse toResponse(Gasto g) {
        return new GastoResponse(
                g.getId(),
                g.getTipoGasto().getId(),
                g.getTipoGasto().getNombre(),
                g.getMonto(),
                g.getDocumento(),
                g.getDescripcion(),
                g.getFecha(),
                g.getCreatedAt()
        );
    }

    private BigDecimal toBigDecimal(Object val) {
        if (val instanceof BigDecimal bd) return bd;
        if (val instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }
}
