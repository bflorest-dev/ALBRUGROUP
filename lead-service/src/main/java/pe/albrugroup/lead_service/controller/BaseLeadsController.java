package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import pe.albrugroup.lead_service.entity.request.BaseLeadsExportFilter;
import pe.albrugroup.lead_service.entity.request.BaseLeadsExportRequest;
import pe.albrugroup.lead_service.entity.response.BaseLeadPreviewResponse;
import pe.albrugroup.lead_service.entity.response.BaseLeadsCountResponse;
import pe.albrugroup.lead_service.service.BaseLeadsExportService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/base-leads")
public class BaseLeadsController {

    private final BaseLeadsExportService exportService;

    @GetMapping("/preview")
    @PreAuthorize("hasAuthority('EXPORT_BASE_LEADS')")
    public ResponseEntity<Page<BaseLeadPreviewResponse>> preview(
            @Valid BaseLeadsExportFilter filter, Pageable pageable) {
        return ResponseEntity.ok(exportService.preview(filter, pageable));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAuthority('EXPORT_BASE_LEADS')")
    public ResponseEntity<BaseLeadsCountResponse> count(@Valid BaseLeadsExportFilter filter) {
        return ResponseEntity.ok(exportService.count(filter));
    }

    @PostMapping("/export")
    @PreAuthorize("hasAuthority('EXPORT_BASE_LEADS')")
    public ResponseEntity<StreamingResponseBody> export(@Valid @RequestBody BaseLeadsExportRequest request) {
        StreamingResponseBody body = exportService.exportZip(request);
        String suggestedName = exportService.generarNombreSugerido(request.getFilter()) + ".zip";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + suggestedName + "\"")
                .body(body);
    }
}
