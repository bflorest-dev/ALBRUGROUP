package pe.albrugroup.rrhh_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.response.EventoResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.service.EventoService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/eventos")
public class EventosController {

    private final EventoService eventoService;

    @GetMapping("/{idEmpleado}/empleados")
    @PreAuthorize("hasAuthority('READ_EVENTOS')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosEmpleado(
            @PathVariable @Positive Long idEmpleado,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(
                eventoService.listarEventosEmpleado(idEmpleado, pageRequest)
        );
    }
}
