package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Distrito;
import pe.albrugroup.lead_service.entity.Origen;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.AnclaFechaBaseLeads;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.VistaBaseLeads;
import pe.albrugroup.lead_service.entity.request.BaseLeadsExportFilter;
import pe.albrugroup.lead_service.entity.request.BaseLeadsExportRequest;
import pe.albrugroup.lead_service.entity.response.AlbLeadRow;
import pe.albrugroup.lead_service.entity.response.BaseLeadExcelRow;
import pe.albrugroup.lead_service.entity.response.BaseLeadPreviewResponse;
import pe.albrugroup.lead_service.entity.response.BaseLeadsCountResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.OrigenRepository;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BaseLeadsExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");
    // Tope de seguridad: el Excel se arma en memoria (ventana SXSSF) antes de streamear; evita OOM
    // si alguien exporta sin acotar. Si se supera, se pide acotar el filtro.
    private static final int MAX_EXCEL_ROWS = 100_000;

    private static final String[] EXCEL_HEADERS = {
            "N° de LEAD", "Asesor preventa", "N° documento", "Nombre del titular",
            "Plan", "Velocidad regular", "Precio regular", "Fecha de instalación",
            "Departamento", "Provincia", "Distrito", "Dirección", "Coordenadas", "Comentario"
    };

    private static final String[] INSTALADOS_EXCEL_HEADERS = {
            "N° de LEAD", "Asesor preventa", "N° documento", "Nombre del titular",
            "Plan", "Velocidad regular", "Precio regular", "Fecha de instalación", "Corte",
            "Estado actual", "Departamento", "Provincia", "Distrito", "Dirección", "Coordenadas", "Comentario"
    };

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("MMM", Locale.ENGLISH);

    private final LeadRepository leadRepository;
    private final OrigenRepository origenRepository;
    private final DistritoRepository distritoRepository;
    private final AlbCryptoService albCryptoService;

    public Page<BaseLeadPreviewResponse> preview(BaseLeadsExportFilter filter, Pageable pageable) {
        return ejecutarQuery(filter, pageable);
    }

    public BaseLeadsCountResponse count(BaseLeadsExportFilter filter) {
        Page<BaseLeadPreviewResponse> page = ejecutarQuery(filter, Pageable.ofSize(1));
        String name = generarNombreSugerido(filter);
        return new BaseLeadsCountResponse(page.getTotalElements(), name);
    }

    public StreamingResponseBody exportZip(BaseLeadsExportRequest request) {
        BaseLeadsExportFilter filter = request.getFilter();

        Origen origen = origenRepository.findByCodigo(request.getOrigenCodigo())
                .orElseThrow(() -> new BadRequestException("Origen no encontrado: " + request.getOrigenCodigo()));

        // Validar la config de encriptacion ANTES de abrir el stream: si falla dentro del
        // StreamingResponseBody la respuesta ya esta comprometida (200 + headers enviados) y el
        // cliente recibe un ZIP valido pero vacio en vez de un error.
        albCryptoService.ensureConfigured();

        List<BaseLeadPreviewResponse> allLeads = ejecutarQuery(filter, Pageable.unpaged()).getContent();
        if (allLeads.isEmpty()) {
            throw new BadRequestException("No hay leads que coincidan con los filtros");
        }

        String baseName = generarNombreSugerido(filter);
        int maxPerFile = request.getMaxLeadsPorArchivo();

        return outputStream -> {
            try (ZipOutputStream zos = new ZipOutputStream(outputStream)) {
                int fileIndex = 1;
                for (int i = 0; i < allLeads.size(); i += maxPerFile) {
                    int end = Math.min(i + maxPerFile, allLeads.size());
                    List<AlbLeadRow> chunk = allLeads.subList(i, end).stream()
                            .map(this::toAlbRow)
                            .toList();

                    byte[] albBytes = albCryptoService.encrypt(chunk, origen.getCodigo());

                    String fileName = String.format("%s_%03d.alb", baseName, fileIndex++);
                    zos.putNextEntry(new ZipEntry(fileName));
                    zos.write(albBytes);
                    zos.closeEntry();
                }
            } catch (IOException e) {
                throw new RuntimeException("Error generando ZIP de export", e);
            }
        };
    }

    // Se arma en memoria y se devuelve como byte[] (respuesta sincrona): a diferencia del ZIP con
    // StreamingResponseBody, evita el re-dispatch async de Spring Security que, con JWT stateless,
    // llega anonimo y cae en Access Denied truncando la descarga.
    public byte[] exportExcel(BaseLeadsExportFilter filter) {
        List<BaseLeadPreviewResponse> seleccion = ejecutarQuery(filter, Pageable.unpaged()).getContent();
        if (seleccion.isEmpty()) {
            throw new BadRequestException("No hay leads que coincidan con los filtros");
        }
        if (seleccion.size() > MAX_EXCEL_ROWS) {
            throw new BadRequestException("Demasiados leads para un Excel (" + seleccion.size()
                    + "). Acota el filtro; el maximo es " + MAX_EXCEL_ROWS + ".");
        }

        List<Long> idsEnOrden = seleccion.stream().map(BaseLeadPreviewResponse::id).toList();

        Map<Long, BaseLeadExcelRow> porId = leadRepository.buscarDatosExcel(idsEnOrden, Etapa.PREVENTA)
                .stream()
                .collect(Collectors.toMap(BaseLeadExcelRow::id, Function.identity(), (a, b) -> a, LinkedHashMap::new));

        Map<String, String[]> ubicacionPorUbigeo = resolverUbicaciones(porId.values());

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Leads");

            CellStyle headerStyle = workbook.createCellStyle();
            Font bold = workbook.createFont();
            bold.setBold(true);
            headerStyle.setFont(bold);

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("dd/mm/yyyy"));

            boolean instalados = filter.getVista() == VistaBaseLeads.INSTALADOS;
            String[] headers = instalados ? INSTALADOS_EXCEL_HEADERS : EXCEL_HEADERS;

            Row header = sheet.createRow(0);
            for (int c = 0; c < headers.length; c++) {
                Cell cell = header.createCell(c);
                cell.setCellValue(headers[c]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Long id : idsEnOrden) {
                BaseLeadExcelRow d = porId.get(id);
                if (d == null) continue;
                String[] ubic = d.ubigeoDomicilio() == null ? null : ubicacionPorUbigeo.get(d.ubigeoDomicilio());

                // El orden de estos valores debe coincidir con EXCEL_HEADERS. Al agregar/quitar
                // columnas se toca solo esta lista (y la cabecera): la escritura por tipo es
                // generica y se adapta sola.
                // Identificador = telefono (l.lead); si es un lead de redes sin telefono, el @usuario.
                String identificador = d.lead() != null && !d.lead().isBlank() ? d.lead() : d.usermeta();
                Object[] valores = instalados
                        ? new Object[]{
                                identificador,
                                d.asesorPreventa(),
                                d.documento(),
                                d.nombreTitular(),
                                d.nombrePlan(),
                                formatVelocidad(d),
                                d.precio(),
                                d.fechaInstalacion(),
                                formatCorte(d),
                                formatEstadoActual(d),
                                ubic == null ? null : ubic[0],
                                ubic == null ? null : ubic[1],
                                ubic == null ? null : ubic[2],
                                d.direccion(),
                                formatCoordenadas(d),
                                d.comentario()
                        }
                        : new Object[]{
                                identificador,
                                d.asesorPreventa(),
                                d.documento(),
                                d.nombreTitular(),
                                d.nombrePlan(),
                                formatVelocidad(d),
                                d.precio(),
                                d.fechaInstalacion(),
                                ubic == null ? null : ubic[0],
                                ubic == null ? null : ubic[1],
                                ubic == null ? null : ubic[2],
                                d.direccion(),
                                formatCoordenadas(d),
                                d.comentario()
                        };

                // Una fila por lead seleccionado: el Excel refleja exactamente la bandeja (mismo
                // filtro, mismo conteo). No se descartan filas aunque un lead tenga pocos datos.
                Row row = sheet.createRow(rowIdx++);
                for (int c = 0; c < valores.length; c++) {
                    escribirCelda(row, c, valores[c], dateStyle);
                }
            }

            workbook.write(out);
            workbook.dispose();
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Error generando Excel de export", e);
        }
    }

    private Map<String, String[]> resolverUbicaciones(Collection<BaseLeadExcelRow> filas) {
        Set<String> codigos = filas.stream()
                .map(BaseLeadExcelRow::ubigeoDomicilio)
                .filter(c -> c != null && !c.isBlank())
                .collect(Collectors.toSet());
        if (codigos.isEmpty()) {
            return Map.of();
        }
        Map<String, String[]> mapa = new HashMap<>();
        for (Distrito d : distritoRepository.findByCodigoInConUbicacion(codigos)) {
            String departamento = d.getDepartamento() == null ? null : d.getDepartamento().getNombre();
            String provincia = d.getProvincia() == null ? null : d.getProvincia().getNombre();
            mapa.put(d.getCodigo(), new String[]{departamento, provincia, d.getNombre()});
        }
        return mapa;
    }

    private String formatVelocidad(BaseLeadExcelRow d) {
        if (d.velocidad() == null) {
            return null;
        }
        return d.unidad() == null ? String.valueOf(d.velocidad()) : d.velocidad() + " " + d.unidad().name();
    }

    private String formatCorte(BaseLeadExcelRow d) {
        if (d.mesCorteBase() == null || d.numeroCorteBase() == null) {
            return null;
        }
        return MONTH_FMT.format(d.mesCorteBase()).toUpperCase(Locale.ROOT)
                + " " + d.numeroCorteBase();
    }

    private String formatEstadoActual(BaseLeadExcelRow d) {
        EstadoClientePostventa estado = d.estadoClientePostventa();
        return switch (estado == null ? EstadoClientePostventa.ACTIVO : estado) {
            case ACTIVO -> "Activo";
            case SUSPENDIDO -> "Suspendido";
            case BAJA -> "Baja";
        };
    }

    // "lat, long" en una sola celda; omite el par si ambos faltan, o muestra el que exista.
    private String formatCoordenadas(BaseLeadExcelRow d) {
        String lat = d.latitud() == null || d.latitud().isBlank() ? null : d.latitud().trim();
        String lon = d.longitud() == null || d.longitud().isBlank() ? null : d.longitud().trim();
        if (lat == null && lon == null) return null;
        if (lat != null && lon != null) return lat + ", " + lon;
        return lat != null ? lat : lon;
    }

    // Escritura por tipo: texto, numero (BigDecimal) o fecha (LocalDate). Ignora null/blank para no
    // crear celdas vacias. Al sumar un tipo nuevo de columna basta con extender este switch.
    private void escribirCelda(Row row, int col, Object value, CellStyle dateStyle) {
        if (value == null) return;
        if (value instanceof String s) {
            if (s.isBlank()) return;
            row.createCell(col).setCellValue(s);
        } else if (value instanceof BigDecimal b) {
            row.createCell(col).setCellValue(b.doubleValue());
        } else if (value instanceof LocalDate ld) {
            Cell cell = row.createCell(col);
            cell.setCellValue(ld);
            cell.setCellStyle(dateStyle);
        } else {
            row.createCell(col).setCellValue(String.valueOf(value));
        }
    }

    private Page<BaseLeadPreviewResponse> ejecutarQuery(BaseLeadsExportFilter filter, Pageable pageable) {
        if (filter.getVista() == VistaBaseLeads.INSTALADOS) {
            boolean filtrarProveedor = filter.getIdProveedor() != null;
            Long idProveedor = filtrarProveedor ? filter.getIdProveedor() : 0L;
            return leadRepository.buscarBaseLeadsInstalados(
                    filtrarProveedor, idProveedor, filter.getDesde(), filter.getHasta(), pageable);
        }

        Instant desde = OperationalDateTime.startOfDay(filter.getDesde());
        Instant hasta = OperationalDateTime.endExclusiveOfDay(filter.getHasta());

        boolean filtrarProveedorOrigen = filter.getIdProveedorOrigen() != null;
        boolean filtrarProveedor = filter.getIdProveedor() != null;
        Collection<String> codigos = filter.getCodigosTipificacion();
        boolean filtrarTipificaciones = codigos != null && !codigos.isEmpty();

        Collection<String> subCodigos = filter.getCodigosSubtipificacion();
        boolean filtrarSubtipificaciones = subCodigos != null && !subCodigos.isEmpty();

        Long idProveedorOrigen = filtrarProveedorOrigen ? filter.getIdProveedorOrigen() : 0L;
        Long idProveedor = filtrarProveedor ? filter.getIdProveedor() : 0L;
        if (!filtrarTipificaciones) {
            codigos = List.of("");
        }
        if (!filtrarSubtipificaciones) {
            subCodigos = List.of("");
        }

        CampoTipificacion campo = filter.getCampoTipificacion();
        if (campo == null) campo = CampoTipificacion.ULTIMA;
        boolean fechaPorIngresoEtapa = filter.getAnclaFecha() == AnclaFechaBaseLeads.INGRESO_ETAPA;

        return switch (campo) {
            case PRIMERA -> leadRepository.buscarBaseLeadsPrimera(
                    filter.getEtapa(), filtrarProveedorOrigen, idProveedorOrigen,
                    filtrarProveedor, idProveedor, filtrarTipificaciones, codigos,
                    filtrarSubtipificaciones, subCodigos,
                    fechaPorIngresoEtapa,
                    desde, hasta, pageable);
            case ULTIMA -> leadRepository.buscarBaseLeadsUltima(
                    filter.getEtapa(), filtrarProveedorOrigen, idProveedorOrigen,
                    filtrarProveedor, idProveedor, filtrarTipificaciones, codigos,
                    filtrarSubtipificaciones, subCodigos,
                    fechaPorIngresoEtapa,
                    desde, hasta, pageable);
            case MAYOR -> leadRepository.buscarBaseLeadsMayor(
                    filter.getEtapa(), filtrarProveedorOrigen, idProveedorOrigen,
                    filtrarProveedor, idProveedor, filtrarTipificaciones, codigos,
                    filtrarSubtipificaciones, subCodigos,
                    fechaPorIngresoEtapa,
                    desde, hasta, pageable);
        };
    }

    private AlbLeadRow toAlbRow(BaseLeadPreviewResponse p) {
        return new AlbLeadRow(p.prefijo(), p.lead(), p.usermeta(), p.documento(), p.direccion(), p.nombre());
    }

    public String generarNombreSugerido(BaseLeadsExportFilter filter) {
        if (filter.getVista() == VistaBaseLeads.INSTALADOS) {
            return "INSTALADOS_" + filter.getDesde().format(DATE_FMT)
                    + "-" + filter.getHasta().format(DATE_FMT);
        }

        StringBuilder sb = new StringBuilder();

        sb.append(filter.getEtapa().name());

        Collection<String> tipis = filter.getCodigosTipificacion();
        if (tipis != null && !tipis.isEmpty()) {
            if (tipis.size() == 1) {
                sb.append("_").append(sanitize(tipis.iterator().next()));
            } else {
                sb.append("_VARIOS");
            }
        } else {
            sb.append("_TODOS");
        }

        sb.append("_").append(filter.getDesde().format(DATE_FMT));
        sb.append("-").append(filter.getHasta().format(DATE_FMT));

        return sb.toString();
    }

    private String sanitize(String value) {
        if (value == null) return "";
        return value.trim()
                .toUpperCase()
                .replaceAll("[^A-Z0-9_]", "_")
                .replaceAll("_+", "_");
    }
}
