package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Origen;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.request.BaseLeadsExportFilter;
import pe.albrugroup.lead_service.entity.request.BaseLeadsExportRequest;
import pe.albrugroup.lead_service.entity.response.AlbLeadRow;
import pe.albrugroup.lead_service.entity.response.BaseLeadPreviewResponse;
import pe.albrugroup.lead_service.entity.response.BaseLeadsCountResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.OrigenRepository;

import java.io.IOException;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BaseLeadsExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final LeadRepository leadRepository;
    private final OrigenRepository origenRepository;
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

    private Page<BaseLeadPreviewResponse> ejecutarQuery(BaseLeadsExportFilter filter, Pageable pageable) {
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

        return switch (campo) {
            case PRIMERA -> leadRepository.buscarBaseLeadsPrimera(
                    filter.getEtapa(), filtrarProveedorOrigen, idProveedorOrigen,
                    filtrarProveedor, idProveedor, filtrarTipificaciones, codigos,
                    filtrarSubtipificaciones, subCodigos,
                    desde, hasta, pageable);
            case ULTIMA -> leadRepository.buscarBaseLeadsUltima(
                    filter.getEtapa(), filtrarProveedorOrigen, idProveedorOrigen,
                    filtrarProveedor, idProveedor, filtrarTipificaciones, codigos,
                    filtrarSubtipificaciones, subCodigos,
                    desde, hasta, pageable);
            case MAYOR -> leadRepository.buscarBaseLeadsMayor(
                    filter.getEtapa(), filtrarProveedorOrigen, idProveedorOrigen,
                    filtrarProveedor, idProveedor, filtrarTipificaciones, codigos,
                    filtrarSubtipificaciones, subCodigos,
                    desde, hasta, pageable);
        };
    }

    private AlbLeadRow toAlbRow(BaseLeadPreviewResponse p) {
        return new AlbLeadRow(p.prefijo(), p.lead(), p.usermeta(), p.documento(), p.direccion(), p.nombre());
    }

    public String generarNombreSugerido(BaseLeadsExportFilter filter) {
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
