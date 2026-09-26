package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Origen;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.AlbFileContent;
import pe.albrugroup.lead_service.entity.response.AlbLeadRow;
import pe.albrugroup.lead_service.entity.response.LeadIntakeMasivoExcelResponse;
import pe.albrugroup.lead_service.entity.response.LeadIntakeMasivoExcelResultadoResponse;
import pe.albrugroup.lead_service.entity.response.LeadRealtimeEvent;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.BusinessException;
import pe.albrugroup.lead_service.repository.OrigenRepository;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AlbIntakeService {

    private static final String PREFIJO_DEFAULT = "+51";

    private final AlbCryptoService albCryptoService;
    private final LeadService leadService;
    private final TransactionTemplate transactionTemplate;
    private final LeadRealtimeNotifier leadRealtimeNotifier;
    private final OrigenRepository origenRepository;

    public LeadIntakeMasivoExcelResponse registrarDesdeAlb(MultipartFile file) {
        validarArchivo(file);

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("No se pudo leer el archivo ALB");
        }

        AlbFileContent content = albCryptoService.decrypt(fileBytes);

        Origen origen = origenRepository.findByCodigo(content.origenCodigo())
                .orElseThrow(() -> new BadRequestException(
                        "Origen del archivo no encontrado: " + content.origenCodigo()));

        List<LeadIntakeMasivoExcelResultadoResponse> resultados = new ArrayList<>();
        Set<String> leadsProcesados = new HashSet<>();
        int fila = 0;

        for (AlbLeadRow row : content.leads()) {
            fila++;
            String lead = normalizarLead(row.lead());
            if (lead.isBlank() || lead.length() != 9) {
                resultados.add(resultadoFallido(fila, row.lead(), origen,
                        "Lead invalido: debe ser 9 digitos"));
                continue;
            }
            if (!leadsProcesados.add(lead)) {
                resultados.add(resultadoFallido(fila, lead, origen,
                        "Lead duplicado dentro del archivo"));
                continue;
            }
            try {
                String prefijo = row.prefijo() != null ? row.prefijo() : PREFIJO_DEFAULT;
                List<String> advertencias = new ArrayList<>();
                Lead savedLead = transactionTemplate.execute(status ->
                        leadService.registrarIngresoLeadMasivo(
                                prefijo,
                                lead,
                                origen,
                                row.documento(),
                                row.direccion(),
                                null,
                                advertencias
                        )
                );
                resultados.add(resultadoExitoso(fila, lead, savedLead));
            } catch (BusinessException e) {
                resultados.add(resultadoFallido(fila, lead, origen, e.getMessage()));
            } catch (Exception e) {
                resultados.add(resultadoFallido(fila, lead, origen,
                        "Ocurrio un error inesperado"));
            }
        }

        int totalRegistrados = (int) resultados.stream()
                .filter(LeadIntakeMasivoExcelResultadoResponse::isRegistrado)
                .count();

        LeadIntakeMasivoExcelResponse response = LeadIntakeMasivoExcelResponse.builder()
                .totalSolicitados(content.count())
                .totalProcesados(resultados.size())
                .totalRegistrados(totalRegistrados)
                .totalFallidos(resultados.size() - totalRegistrados)
                .resultados(resultados)
                .build();

        publicarRegistroMasivo(response);
        return response;
    }

    private void validarArchivo(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Debe enviar un archivo ALB");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".alb")) {
            throw new BadRequestException("Solo se permiten archivos .alb");
        }
    }

    private String normalizarLead(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
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

    private LeadIntakeMasivoExcelResultadoResponse resultadoExitoso(int fila, String lead, Lead savedLead) {
        return LeadIntakeMasivoExcelResultadoResponse.builder()
                .fila(fila)
                .lead(lead)
                .idLead(savedLead.getId())
                .registrado(true)
                .mensaje("Lead registrado correctamente")
                .advertencias(List.of())
                .origenUsado(savedLead.getOrigen() == null ? null : savedLead.getOrigen().getNombre())
                .build();
    }

    private LeadIntakeMasivoExcelResultadoResponse resultadoFallido(
            int fila, String lead, Origen origen, String mensaje) {
        return LeadIntakeMasivoExcelResultadoResponse.builder()
                .fila(fila)
                .lead(lead)
                .registrado(false)
                .mensaje(mensaje)
                .advertencias(List.of())
                .origenUsado(origen.getNombre())
                .build();
    }
}
