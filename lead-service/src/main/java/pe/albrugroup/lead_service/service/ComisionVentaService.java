package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.response.ComisionVentaResponse;
import pe.albrugroup.lead_service.entity.response.ComisionVentaResponse.ComisionVentaAsesorResponse;
import pe.albrugroup.lead_service.entity.response.ComisionVentaResponse.ComisionVentaCorteResponse;
import pe.albrugroup.lead_service.repository.ComisionVentaRepository;
import pe.albrugroup.lead_service.repository.projection.ComisionVentaAsesorProjection;

import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ComisionVentaService {

    private static final String PROVEEDOR_POR_DEFECTO = "WIN";
    private static final Locale ES = Locale.forLanguageTag("es");

    private final ComisionVentaRepository comisionRepository;

    public ComisionVentaResponse calcularVentasPorCorte(LocalDate mesComisionParam, String proveedorParam, LocalDate fechaLimiteMorosidad) {
        YearMonth mesComision = resolverMesComision(mesComisionParam);
        String proveedor = (proveedorParam == null || proveedorParam.isBlank())
                ? PROVEEDOR_POR_DEFECTO
                : proveedorParam.trim().toUpperCase(ES);
        // Sin fecha límite: usar sentinela futura para no excluir a nadie por morosidad.
        LocalDate limite = fechaLimiteMorosidad != null ? fechaLimiteMorosidad : LocalDate.of(9999, 12, 31);

        // Corte A: (M-2) Corte 2,  Corte B: (M-1) Corte 1
        YearMonth mesA = mesComision.minusMonths(2);
        YearMonth mesB = mesComision.minusMonths(1);
        LocalDate mesCorte1 = mesA.atDay(1);
        int numCorte1 = 2;
        LocalDate mesCorte2 = mesB.atDay(1);
        int numCorte2 = 1;

        List<ComisionVentaAsesorProjection> rows = comisionRepository.ventasPorCorteYAsesor(
                proveedor, limite, mesCorte1, numCorte1, mesCorte2, numCorte2);

        Map<String, List<ComisionVentaAsesorProjection>> porCorte = new LinkedHashMap<>();
        for (ComisionVentaAsesorProjection row : rows) {
            String key = row.getMesCorteBase() + "|" + row.getNumeroCorteBase();
            porCorte.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
        }

        List<ComisionVentaCorteResponse> cortes = new ArrayList<>(2);

        agregarCorte(cortes, mesCorte1, numCorte1, porCorte.get(mesCorte1 + "|" + numCorte1));
        agregarCorte(cortes, mesCorte2, numCorte2, porCorte.get(mesCorte2 + "|" + numCorte2));

        return ComisionVentaResponse.builder()
                .mesComision(mesComision.atDay(1))
                .cortes(cortes)
                .build();
    }

    private void agregarCorte(
            List<ComisionVentaCorteResponse> cortes,
            LocalDate mesCorteBase,
            int numeroCorteBase,
            List<ComisionVentaAsesorProjection> rows
    ) {
        List<ComisionVentaAsesorResponse> asesores = rows == null ? List.of() : rows.stream()
                .map(r -> ComisionVentaAsesorResponse.builder()
                        .idAsesor(r.getIdAsesor())
                        .nombreAsesor(r.getNombreAsesor())
                        .ventasTotales((int) r.getVentasTotales())
                        .ventasLima((int) r.getVentasLima())
                        .build())
                .toList();

        YearMonth ym = YearMonth.from(mesCorteBase);
        String mes = capitalizar(Month.from(mesCorteBase).getDisplayName(TextStyle.FULL, ES));

        cortes.add(ComisionVentaCorteResponse.builder()
                .mesCorteBase(mesCorteBase)
                .numeroCorteBase(numeroCorteBase)
                .etiqueta(mes + " · Corte " + numeroCorteBase)
                .mesAsistencia(ym.getMonthValue())
                .anioAsistencia(ym.getYear())
                .asesores(asesores)
                .build());
    }

    static YearMonth resolverMesComision(LocalDate mesComisionParam) {
        if (mesComisionParam != null) {
            return YearMonth.from(mesComisionParam);
        }
        return YearMonth.from(OperationalDateTime.today());
    }

    private static String capitalizar(String texto) {
        if (texto == null || texto.isEmpty()) return texto;
        return Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
    }
}
