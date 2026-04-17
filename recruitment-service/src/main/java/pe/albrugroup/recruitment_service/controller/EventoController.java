package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.EventoResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.service.EventoService;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postulaciones/{idPostulacion}/eventos")
public class EventoController {

    private final EventoService eventoService;

    @GetMapping
    @PreAuthorize("hasAuthority('READ_EVENTOS_RECRUITMENT')")
    public ResponseEntity<PageResponse<EventoResponse>> listarEventosPorPostulacion(
            @PathVariable @Positive Long idPostulacion,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(eventoService.listarPorPostulacion(idPostulacion, pageRequest));
    }
}
