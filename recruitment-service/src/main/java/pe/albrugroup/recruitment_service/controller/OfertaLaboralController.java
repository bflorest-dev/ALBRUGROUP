package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.EstadoOferta;
import pe.albrugroup.recruitment_service.entity.request.OfertaAmpliacionRequest;
import pe.albrugroup.recruitment_service.entity.request.OfertaLaboralRequest;
import pe.albrugroup.recruitment_service.entity.response.OfertaAmpliacionResponse;
import pe.albrugroup.recruitment_service.entity.response.OfertaLaboralResponse;
import pe.albrugroup.recruitment_service.service.OfertaLaboralService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/ofertas-laborales")
public class OfertaLaboralController {

    private final OfertaLaboralService ofertaLaboralService;

    @PostMapping
    public ResponseEntity<OfertaLaboralResponse> registrarOfertaLaboral(@RequestBody @Valid OfertaLaboralRequest request) {
        var oferta = ofertaLaboralService.registrarOfertaLaboral(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(oferta);
    }

    @PostMapping("/{idOfertaLaboral}/ampliacion")
    public ResponseEntity<OfertaAmpliacionResponse> registrarAmpliacion(
            @PathVariable @Positive Long idOfertaLaboral,
            @RequestBody @Valid OfertaAmpliacionRequest request
    ) {
        var ampliacion = ofertaLaboralService.registrarAmpliacion(idOfertaLaboral, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ampliacion);
    }

    @GetMapping("/activas")
    public ResponseEntity<List<OfertaLaboralResponse>> listarOfertasActivas() {
        return ResponseEntity.ok(ofertaLaboralService.listarOfertasLaborales(EstadoOferta.ACTIVO));
    }

    @GetMapping
    public ResponseEntity<List<OfertaLaboralResponse>> listarOfertasLaborales(
            @RequestParam(required = false) EstadoOferta estado
    ) {
        return ResponseEntity.ok(ofertaLaboralService.listarOfertasLaborales(estado));
    }

    // Falta metodo para cambiar de estado a las Ofertas Laborales
}
