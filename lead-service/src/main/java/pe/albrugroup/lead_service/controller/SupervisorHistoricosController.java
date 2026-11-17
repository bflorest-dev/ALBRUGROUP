package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.CampoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.ModoFechaMasivo;
import pe.albrugroup.lead_service.entity.enums.TipoGrupoGtr;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.request.SupervisorHistoricosEquipoMasivoRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrAgrupacionesResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.entity.response.SupervisorHistoricosEquipoMasivoResponse;
import pe.albrugroup.lead_service.service.SupervisorHistoricosService;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/preventa/supervisor/historicos")
public class SupervisorHistoricosController {

    private final SupervisorHistoricosService service;

    @GetMapping("/leads")
    @PreAuthorize("hasAuthority('READ_HISTORICOS_SUPERVISOR_GTR')")
    public ResponseEntity<PageResponse<LeadGtrResponse>> listarLeads(
            @RequestParam(required = false) List<String> codigosTipificacion,
            @RequestParam(required = false) List<String> codigosSubtipificacion,
            @RequestParam(defaultValue = "ULTIMA") CampoTipificacion campoTipificacion,
            @RequestParam(defaultValue = "GESTIONADOS") ModoFechaMasivo modoFecha,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) TipoGrupoGtr tipoGrupo,
            @RequestParam(required = false) EstadoSeguimiento estado,
            @RequestParam(required = false) String codigoTipificacion,
            @RequestParam(required = false) String codigoSubtipificacion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaIngreso,
            @RequestParam(defaultValue = "false") boolean sinValor,
            @RequestParam(required = false) Long idEquipo,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(service.listarLeads(
                codigosTipificacion, codigosSubtipificacion, campoTipificacion, modoFecha,
                fechaDesde, fechaHasta, tipoGrupo, estado, codigoTipificacion,
                codigoSubtipificacion, fechaIngreso, sinValor, idEquipo, pageRequest
        ));
    }

    @GetMapping("/leads/agrupaciones")
    @PreAuthorize("hasAuthority('READ_HISTORICOS_SUPERVISOR_GTR')")
    public ResponseEntity<LeadGtrAgrupacionesResponse> listarAgrupaciones(
            @RequestParam(required = false) List<String> codigosTipificacion,
            @RequestParam(required = false) List<String> codigosSubtipificacion,
            @RequestParam(defaultValue = "ULTIMA") CampoTipificacion campoTipificacion,
            @RequestParam(defaultValue = "GESTIONADOS") ModoFechaMasivo modoFecha,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @RequestParam(required = false) Long idEquipo
    ) {
        return ResponseEntity.ok(service.listarAgrupaciones(
                codigosTipificacion, codigosSubtipificacion, campoTipificacion, modoFecha,
                fechaDesde, fechaHasta, idEquipo
        ));
    }

    @PatchMapping("/equipo-masivo")
    @PreAuthorize("hasAuthority('ASSIGN_HISTORICOS_EQUIPO_SUPERVISOR_GTR')")
    public ResponseEntity<SupervisorHistoricosEquipoMasivoResponse> moverLeads(
            @Valid @RequestBody SupervisorHistoricosEquipoMasivoRequest request
    ) {
        return ResponseEntity.ok(service.moverLeads(request));
    }
}
