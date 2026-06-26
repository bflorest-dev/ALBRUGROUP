package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.MasivoService;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/masivo")
public class MasivoController {

    private final MasivoService masivoService;

    @GetMapping("/leads") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<PageResponse<LeadGtrResponse>> listarLeadsMasivo(
            @RequestParam(required = false) Long idProveedor,
            @RequestParam(required = false) Etapa etapa,
            @RequestParam(required = false) List<Long> tipificaciones,
            @RequestParam(required = false) List<Long> subtipificaciones,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) TipoGrupoGtr tipoGrupo,
            @RequestParam(required = false) EstadoSeguimiento estado,
            @RequestParam(required = false) String codigoTipificacion,
            @RequestParam(required = false) String codigoSubtipificacion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaIngreso,
            @RequestParam(defaultValue = "false") boolean sinValor,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = masivoService.listarLeads(
                idProveedor,
                etapa,
                tipificaciones,
                subtipificaciones,
                fechaDesde,
                fechaHasta,
                tipoGrupo,
                estado,
                codigoTipificacion,
                codigoSubtipificacion,
                fechaIngreso,
                sinValor,
                pageRequest
        );
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }

    @GetMapping("/leads/agrupaciones") @PreAuthorize("hasAuthority('READ_LEADS_GTR')")
    public ResponseEntity<LeadGtrAgrupacionesResponse> listarAgrupacionesLeadsMasivo(
            @RequestParam(required = false) Long idProveedor,
            @RequestParam(required = false) Etapa etapa,
            @RequestParam(required = false) List<Long> tipificaciones,
            @RequestParam(required = false) List<Long> subtipificaciones,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        return ResponseEntity.ok(masivoService.listarAgrupaciones(
                idProveedor,
                etapa,
                tipificaciones,
                subtipificaciones,
                fechaDesde,
                fechaHasta
        ));
    }
}
