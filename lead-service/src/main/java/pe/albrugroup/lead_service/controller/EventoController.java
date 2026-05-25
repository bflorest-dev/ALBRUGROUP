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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.EventoService;

import java.time.LocalDate;
@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/eventos")
public class EventoController {

    private final EventoService eventoService;

    @GetMapping("/lead/{idLead}") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosPorLead(
            @PathVariable Long idLead,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorLead(idLead, fechaDesde, fechaHasta, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }

    @GetMapping("/empleado/{idEmpleado}") @PreAuthorize("hasAuthority('READ_EVENTOS_LEADS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosPorEmpleado(
            @PathVariable Long idEmpleado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var eventos = eventoService.listarPorEmpleado(idEmpleado, fechaDesde, fechaHasta, pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }
}
