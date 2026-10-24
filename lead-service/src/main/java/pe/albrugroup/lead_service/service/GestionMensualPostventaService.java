package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.response.GestionMensualFilaResponse;
import pe.albrugroup.lead_service.entity.response.GestionMensualPostventaResponse;
import pe.albrugroup.lead_service.entity.response.GestionCohorteFilaResponse;
import pe.albrugroup.lead_service.entity.response.GestionCohortePostventaResponse;
import pe.albrugroup.lead_service.entity.response.VentanaDecisionPostventaResponse;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.repository.projection.GestionCohorteCorteProjection;
import pe.albrugroup.lead_service.repository.projection.GestionMensualCorteProjection;

import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GestionMensualPostventaService {

    // La empresa cambia la gestion del mes el dia 15: hasta el 14 sigue vigente el mes anterior.
    private static final int DIA_CAMBIO_GESTION = 15;
    private static final String PROVEEDOR_POR_DEFECTO = "WIN";
    private static final Locale ES = Locale.forLanguageTag("es");

    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final ProveedorScopeService proveedorScopeService;

    public GestionMensualPostventaResponse obtenerGestionMensual(LocalDate mesGestionParam, String proveedorParam) {
        YearMonth mesGestion = resolverMesGestion(mesGestionParam, OperationalDateTime.today());
        String proveedor = resolverProveedor(proveedorParam);
        int anioMes = mesGestion.getYear() * 12 + mesGestion.getMonthValue();

        List<GestionMensualFilaResponse> filas = periodoRepository
                .gestionMensualPorCorte(anioMes, proveedor).stream()
                .map(this::toFila)
                .toList();

        return GestionMensualPostventaResponse.builder()
                .mesGestion(mesGestion.atDay(1))
                .proveedor(proveedor)
                .filas(filas)
                .build();
    }

    public GestionCohortePostventaResponse obtenerGestionPorCohorte(
            LocalDate mesCohorteParam,
            String proveedorParam
    ) {
        String proveedor = resolverProveedor(proveedorParam);
        LocalDate hoy = OperationalDateTime.today();
        LocalDate ultimaMesCohorte = periodoRepository.ultimaMesCohorte(proveedor);
        LocalDate mesCohorte = resolverMesCohorte(mesCohorteParam, ultimaMesCohorte, hoy);
        VentanaDecision ventana = resolverVentanaDecision(hoy);

        List<GestionCohorteFilaResponse> filas = periodoRepository
                .gestionPorCohorte(mesCohorte, proveedor).stream()
                .map(this::toFilaCohorte)
                .toList();
        List<GestionCohorteFilaResponse> filasVentana = periodoRepository
                .gestionPorVencimiento(ventana.fechaVencimientoObjetivo(), proveedor).stream()
                .map(this::toFilaCohorte)
                .toList();

        return GestionCohortePostventaResponse.builder()
                .mesCohorte(mesCohorte)
                .ultimaMesCohorte(ultimaMesCohorte)
                .fechaOperacion(hoy)
                .proveedor(proveedor)
                .filas(filas)
                .ventanaDecision(VentanaDecisionPostventaResponse.builder()
                        .fechaVencimientoObjetivo(ventana.fechaVencimientoObjetivo())
                        .fechaLimite(ventana.fechaLimite())
                        .vencimientoOcurrido(!hoy.isBefore(ventana.fechaVencimientoObjetivo()))
                        .filas(filasVentana)
                        .build())
                .build();
    }

    /**
     * Resuelve el mes de gestion vigente. Si se pide uno explicito, se usa ese; si no, se deriva de la
     * fecha operativa con la regla del dia 15 (>= 15 -> mes actual; antes -> mes anterior).
     */
    static YearMonth resolverMesGestion(LocalDate mesGestionParam, LocalDate hoy) {
        if (mesGestionParam != null) {
            return YearMonth.from(mesGestionParam);
        }
        YearMonth actual = YearMonth.from(hoy);
        return hoy.getDayOfMonth() >= DIA_CAMBIO_GESTION ? actual : actual.minusMonths(1);
    }

    /** Etiqueta en lenguaje de usuario final, p. ej. "Junio · Corte 1 · Recibo 2". */
    static String construirEtiqueta(LocalDate mesCorteBase, Integer numeroCorteBase, Integer numeroFactura) {
        String mes = capitalizar(Month.of(mesCorteBase.getMonthValue()).getDisplayName(TextStyle.FULL, ES));
        return mes + " · Corte " + numeroCorteBase + " · Recibo " + numeroFactura;
    }

    private GestionMensualFilaResponse toFila(GestionMensualCorteProjection p) {
        return GestionMensualFilaResponse.builder()
                .mesCorteBase(p.getMesCorteBase())
                .numeroCorteBase(p.getNumeroCorteBase())
                .numeroFactura(p.getNumeroFactura())
                .etiqueta(construirEtiqueta(p.getMesCorteBase(), p.getNumeroCorteBase(), p.getNumeroFactura()))
                .total(p.getTotal())
                .pagadoCliente(p.getPagadoCliente())
                .pagadoEmpresa(p.getPagadoEmpresa())
                .impagos(p.getImpagos())
                .bajas(p.getBajas())
                .build();
    }

    private GestionCohorteFilaResponse toFilaCohorte(GestionCohorteCorteProjection p) {
        return GestionCohorteFilaResponse.builder()
                .mesCorteBase(p.getMesCorteBase())
                .numeroCorteBase(p.getNumeroCorteBase())
                .numeroFactura(p.getNumeroFactura())
                .fechaVencimiento(p.getFechaVencimiento())
                .total(p.getTotal())
                .pagadoCliente(p.getPagadoCliente())
                .pagadoEmpresa(p.getPagadoEmpresa())
                .impagos(p.getImpagos())
                .bajas(p.getBajas())
                .build();
    }

    static LocalDate resolverMesCohorte(LocalDate mesCohorteParam, LocalDate ultimaMesCohorte, LocalDate hoy) {
        if (mesCohorteParam != null) {
            return YearMonth.from(mesCohorteParam).atDay(1);
        }
        if (ultimaMesCohorte != null) {
            return YearMonth.from(ultimaMesCohorte).atDay(1);
        }
        return YearMonth.from(hoy).atDay(1);
    }

    static VentanaDecision resolverVentanaDecision(LocalDate hoy) {
        YearMonth mesVencimiento = hoy.getDayOfMonth() <= DIA_CAMBIO_GESTION
                ? YearMonth.from(hoy).minusMonths(1)
                : YearMonth.from(hoy);
        LocalDate fechaVencimiento = mesVencimiento.atDay(Math.min(28, mesVencimiento.lengthOfMonth()));
        LocalDate fechaLimite = mesVencimiento.plusMonths(1).atDay(DIA_CAMBIO_GESTION);
        return new VentanaDecision(fechaVencimiento, fechaLimite);
    }

    record VentanaDecision(LocalDate fechaVencimientoObjetivo, LocalDate fechaLimite) {
    }

    /**
     * Un usuario de POSTVENTA ve la gestión de SU proveedor activo (el del selector, vía header
     * X-Proveedor-Id): así un postventa de CLARO no ve las cifras de WIN. Para ADMIN (u otros roles sin
     * ámbito de proveedor) se respeta el parámetro recibido, con WIN por defecto (comportamiento previo).
     */
    private String resolverProveedor(String proveedorParam) {
        if (proveedorScopeService.ambitoActual() == AmbitoProveedor.POSTVENTA) {
            Set<String> nombres = proveedorScopeService.resolverScope(AmbitoProveedor.POSTVENTA).proveedorNombres();
            if (nombres.size() == 1) {
                return nombres.iterator().next();
            }
        }
        return normalizarProveedor(proveedorParam);
    }

    private String normalizarProveedor(String proveedor) {
        if (proveedor == null || proveedor.isBlank()) {
            return PROVEEDOR_POR_DEFECTO;
        }
        return proveedor.trim().toUpperCase(ES);
    }

    private static String capitalizar(String texto) {
        if (texto == null || texto.isEmpty()) {
            return texto;
        }
        return Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
    }
}
