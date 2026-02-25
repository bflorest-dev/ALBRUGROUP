package pe.albrugroup.rrhh_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.rrhh_service.entity.response.PostulanteEventoResponse;
import pe.albrugroup.rrhh_service.service.PostulanteEventoService;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/eventos")
public class EventosController {

    private final PostulanteEventoService postulanteEventoService;

    @GetMapping("/postulantes")
    @PreAuthorize("hasAuthority('READ_POSTULANTES')")
    public ResponseEntity<List<PostulanteEventoResponse>> listarEventosPostulante(
            @RequestParam @Positive Long idPostulante,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        var eventos = postulanteEventoService.buscarEventos(idPostulante, desde, hasta);
        return ResponseEntity.ok(eventos);
    }
}
