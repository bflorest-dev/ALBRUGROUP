package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.EventoResponse;
import pe.albrugroup.lead_service.service.EventoService;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/eventos")
public class EventoController {

    private final EventoService eventoService;

    @GetMapping("/lead/{idLead}")
    public ResponseEntity<List<EventoResponse>> listarEventosPorLead(@PathVariable Long idLead) {
        var eventos = eventoService.listarPorLead(idLead);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }

    @GetMapping("/empleado/{idEmpleado}")
    public ResponseEntity<List<EventoResponse>> listarEventosPorEmpleado(
            @PathVariable Long idEmpleado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaDesde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaHasta
    ) {
        var eventos = eventoService.listarPorEmpleado(idEmpleado, fechaDesde, fechaHasta);
        return ResponseEntity.status(HttpStatus.OK).body(eventos);
    }
}
