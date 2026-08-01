package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.response.GestionMensualFilaResponse;
import pe.albrugroup.lead_service.entity.response.GestionMensualPostventaResponse;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.repository.projection.GestionMensualCorteProjection;

import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GestionMensualPostventaService {

    // La empresa cambia la gestion del mes el dia 15: hasta el 14 sigue vigente el mes anterior.
    private static final int DIA_CAMBIO_GESTION = 15;
    private static final String PROVEEDOR_POR_DEFECTO = "WIN";
    private static final Locale ES = Locale.forLanguageTag("es");

    private final PeriodoFacturacionPostventaRepository periodoRepository;

    public GestionMensualPostventaResponse obtenerGestionMensual(LocalDate mesGestionParam, String proveedorParam) {
        YearMonth mesGestion = resolverMesGestion(mesGestionParam, OperationalDateTime.today());
        String proveedor = normalizarProveedor(proveedorParam);
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
