package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.request.ActualizarEstadoOfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaAmpliacionRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaAmpliacionResponse;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.service.OfertaLaboralService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/ofertas-laborales")
public class OfertaLaboralController {

    private final OfertaLaboralService ofertaLaboralService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_OFERTAS_LABORALES')")
    public ResponseEntity<OfertaLaboralResponse> registrarOfertaLaboral(@RequestBody @Valid OfertaLaboralRequest request) {
        var oferta = ofertaLaboralService.registrarOfertaLaboral(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(oferta);
    }

    @PostMapping("/{idOfertaLaboral}/ampliacion")
    @PreAuthorize("hasAuthority('UPDATE_OFERTAS_LABORALES')")
    public ResponseEntity<OfertaAmpliacionResponse> registrarAmpliacion(
            @PathVariable @Positive Long idOfertaLaboral,
            @RequestBody @Valid OfertaAmpliacionRequest request
    ) {
        var ampliacion = ofertaLaboralService.registrarAmpliacion(idOfertaLaboral, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ampliacion);
    }

    @GetMapping("/activas")
    @PreAuthorize("hasAuthority('READ_OFERTAS_LABORALES_ACTIVAS')")
    public ResponseEntity<List<OfertaLaboralResponse>> listarOfertasActivas() {
        return ResponseEntity.ok(ofertaLaboralService.listarOfertasActivas());
    }

    @GetMapping
    @PreAuthorize("hasAuthority('READ_OFERTAS_LABORALES')")
    public ResponseEntity<PageResponse<OfertaLaboralResponse>> listarOfertasLaborales(
            @RequestParam(required = false) EstadoOferta estado,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(ofertaLaboralService.listarOfertasLaborales(estado, pageRequest));
    }

    @PatchMapping("/{idOfertaLaboral}/estado")
    @PreAuthorize("hasAuthority('UPDATE_ESTADO_OFERTAS_LABORALES')")
    public ResponseEntity<OfertaLaboralResponse> actualizarEstadoOfertaLaboral(
            @PathVariable @Positive Long idOfertaLaboral,
            @RequestBody @Valid ActualizarEstadoOfertaLaboralRequest request
    ) {
        return ResponseEntity.ok(ofertaLaboralService.actualizarEstadoOfertaLaboral(idOfertaLaboral, request));
    }
}
