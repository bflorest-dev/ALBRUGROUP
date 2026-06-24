package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadIntakeMasivoExcelResponse;
import pe.albrugroup.lead_service.entity.response.LeadIntakeMasivoExcelResultadoResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.BusinessException;

import java.io.IOException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class LeadExcelIntakeService {

    private static final String HEADER_LEAD = "lead";
    private static final String HEADER_BASE = "base";
    private static final String HEADER_DOCUMENTO = "documento";
    private static final String HEADER_DIRECCION = "direccion";
    private static final String PREFIJO_DEFAULT = "+51";
    private static final Map<String, Integer> REQUIRED_HEADERS = Map.of(
            HEADER_LEAD, 0,
            HEADER_BASE, 1,
            HEADER_DOCUMENTO, 2,
            HEADER_DIRECCION, 3
    );

    private final LeadService leadService;
    private final TransactionTemplate transactionTemplate;
    private final LeadRealtimeNotifier leadRealtimeNotifier;

    @Value("${app.lead.intake.masivo.id-campana-base:#{null}}")
    private Long idCampanaBaseMasivo;

    public LeadIntakeMasivoExcelResponse registrarDesdeExcel(MultipartFile file) {
        validarArchivo(file);
        List<LeadExcelRow> rows = leerFilas(file);
        List<LeadIntakeMasivoExcelResultadoResponse> resultados = new ArrayList<>();
        Set<String> leadsProcesados = new HashSet<>();

        for (LeadExcelRow row : rows) {
            if (!row.valida()) {
                resultados.add(resultadoFallido(row, row.mensajeError(), row.advertencias(), row.base()));
                continue;
            }
            if (!leadsProcesados.add(row.lead())) {
                resultados.add(resultadoFallido(
                        row,
                        "Lead duplicado dentro del archivo",
                        row.advertencias(),
                        row.base()
                ));
                continue;
            }
            try {
                Lead savedLead = transactionTemplate.execute(status -> leadService.registrarIngresoLeadMasivo(
                        PREFIJO_DEFAULT,
                        row.lead(),
                        row.base(),
                        row.documento(),
                        row.direccion(),
                        idCampanaBaseMasivo,
                        row.advertencias()
                ));
                resultados.add(resultadoExitoso(row, savedLead));
            } catch (BusinessException e) {
                resultados.add(resultadoFallido(row, e.getMessage(), row.advertencias(), row.base()));
            } catch (Exception e) {
                resultados.add(resultadoFallido(row, "Ocurrio un error inesperado", row.advertencias(), row.base()));
            }
        }

        int totalRegistrados = (int) resultados.stream()
                .filter(LeadIntakeMasivoExcelResultadoResponse::isRegistrado)
                .count();

        LeadIntakeMasivoExcelResponse response = LeadIntakeMasivoExcelResponse.builder()
                .totalSolicitados(rows.size())
                .totalProcesados(resultados.size())
                .totalRegistrados(totalRegistrados)
                .totalFallidos(resultados.size() - totalRegistrados)
                .resultados(resultados)
                .build();
        publicarRegistroMasivo(response);
        return response;
    }

    private void publicarRegistroMasivo(LeadIntakeMasivoExcelResponse response) {
        if (response.getTotalProcesados() == 0 || response.getTotalRegistrados() == 0) {
            return;
        }
        leadRealtimeNotifier.publishAfterCommit(LeadRealtimeEvent.builder()
                .tipo("REGISTRO_MASIVO")
                .etapa(Etapa.PREVENTA)
                .totalProcesados(response.getTotalProcesados())
                .totalRegistrados(response.getTotalRegistrados())
                .totalFallidos(response.getTotalFallidos())
                .occurredAt(OperationalDateTime.now())
                .build());
    }

    private void validarArchivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debe enviar un archivo Excel");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw new BadRequestException("Solo se permiten archivos .xlsx");
        }
    }

    private List<LeadExcelRow> leerFilas(MultipartFile file) {
        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            if (workbook.getNumberOfSheets() == 0) {
                throw new BadRequestException("El Excel no contiene hojas");
            }
            Sheet sheet = workbook.getSheetAt(0);
            validarHeaders(sheet.getRow(0));
            return leerFilasDatos(sheet);
        } catch (IOException e) {
            throw new BadRequestException("No se pudo leer el archivo Excel");
        }
    }

    private void validarHeaders(Row headerRow) {
        if (headerRow == null) {
            throw new BadRequestException("El Excel debe tener encabezados en la primera fila");
        }

        DataFormatter formatter = new DataFormatter();
        for (Map.Entry<String, Integer> header : REQUIRED_HEADERS.entrySet()) {
            String value = normalizarHeader(formatter.formatCellValue(headerRow.getCell(header.getValue())));
            if (!header.getKey().equals(value)) {
                throw new BadRequestException(
                        "El Excel debe tener las columnas Lead, Base, Documento y Direccion en la primera fila"
                );
            }
        }
        for (int col = REQUIRED_HEADERS.size(); col < headerRow.getLastCellNum(); col++) {
            if (!formatter.formatCellValue(headerRow.getCell(col)).isBlank()) {
                throw new BadRequestException("El Excel debe tener exactamente 4 columnas");
            }
        }
    }

    private List<LeadExcelRow> leerFilasDatos(Sheet sheet) {
        List<LeadExcelRow> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter();
        for (int index = 1; index <= sheet.getLastRowNum(); index++) {
            Row row = sheet.getRow(index);
            if (filaVacia(row, formatter)) {
                continue;
            }
            rows.add(toLeadExcelRow(row, formatter));
        }
        if (rows.isEmpty()) {
            throw new BadRequestException("El Excel no contiene filas para procesar");
        }
        return rows;
    }

    private LeadExcelRow toLeadExcelRow(Row row, DataFormatter formatter) {
        int fila = row.getRowNum() + 1;
        List<String> advertencias = new ArrayList<>();

        String rawLead = leerCelda(row, REQUIRED_HEADERS.get(HEADER_LEAD), formatter);
        String lead = normalizarDigitos(rawLead);
        if (lead.isBlank()) {
            return LeadExcelRow.invalida(fila, lead, Base.MASIVO, "La fila " + fila + " no tiene Lead");
        }
        if (lead.length() != 9) {
            return LeadExcelRow.invalida(fila, lead, Base.MASIVO, "La fila " + fila + " debe tener un Lead de 9 digitos");
        }

        Base base = resolverBase(leerCelda(row, REQUIRED_HEADERS.get(HEADER_BASE), formatter), advertencias);
        String documento = leerCelda(row, REQUIRED_HEADERS.get(HEADER_DOCUMENTO), formatter);
        if (!documento.isBlank() && !documento.matches("^\\d+$")) {
            return LeadExcelRow.invalida(fila, lead, base, "La fila " + fila + " tiene Documento invalido", advertencias);
        }

        return new LeadExcelRow(
                fila,
                lead,
                base,
                documento.isBlank() ? null : documento,
                trimToNull(leerCelda(row, REQUIRED_HEADERS.get(HEADER_DIRECCION), formatter)),
                advertencias,
                true,
                null
        );
    }

    private Base resolverBase(String rawBase, List<String> advertencias) {
        String value = trimToNull(rawBase);
        if (value == null) {
            return Base.MASIVO;
        }
        try {
            return Base.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            advertencias.add("Base invalida; se uso MASIVO");
            return Base.MASIVO;
        }
    }

    private boolean filaVacia(Row row, DataFormatter formatter) {
        if (row == null) {
            return true;
        }
        for (int col = 0; col < REQUIRED_HEADERS.size(); col++) {
            if (!leerCelda(row, col, formatter).isBlank()) {
                return false;
            }
        }
        return true;
    }

    private String leerCelda(Row row, int col, DataFormatter formatter) {
        Cell cell = row == null ? null : row.getCell(col);
        return formatter.formatCellValue(cell).trim();
    }

    private String normalizarHeader(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.trim().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
    }

    private String normalizarDigitos(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private LeadIntakeMasivoExcelResultadoResponse resultadoExitoso(LeadExcelRow row, Lead lead) {
        boolean campanaInferida = row.advertencias().stream()
                .anyMatch(advertencia -> advertencia.contains("Campana BASE"));
        return LeadIntakeMasivoExcelResultadoResponse.builder()
                .fila(row.fila())
                .lead(row.lead())
                .idLead(lead.getId())
                .registrado(true)
                .mensaje("Lead registrado correctamente")
                .advertencias(row.advertencias())
                .baseUsada(lead.getBase())
                .idCampanaUsada(lead.getCampana() == null ? null : lead.getCampana().getId())
                .campanaUsada(lead.getCampana() == null ? null : lead.getCampana().getNombre())
                .campanaInferida(campanaInferida)
                .build();
    }

    private LeadIntakeMasivoExcelResultadoResponse resultadoFallido(
            LeadExcelRow row,
            String mensaje,
            List<String> advertencias,
            Base base
    ) {
        return LeadIntakeMasivoExcelResultadoResponse.builder()
                .fila(row.fila())
                .lead(row.lead())
                .registrado(false)
                .mensaje(mensaje)
                .advertencias(advertencias)
                .baseUsada(base)
                .build();
    }

    private record LeadExcelRow(
            int fila,
            String lead,
            Base base,
            String documento,
            String direccion,
            List<String> advertencias,
            boolean valida,
            String mensajeError
    ) {
        private static LeadExcelRow invalida(int fila, String lead, Base base, String mensajeError) {
            return invalida(fila, lead, base, mensajeError, new ArrayList<>());
        }

        private static LeadExcelRow invalida(
                int fila,
                String lead,
                Base base,
                String mensajeError,
                List<String> advertencias
        ) {
            return new LeadExcelRow(fila, lead, base, null, null, advertencias, false, mensajeError);
        }
    }
}
