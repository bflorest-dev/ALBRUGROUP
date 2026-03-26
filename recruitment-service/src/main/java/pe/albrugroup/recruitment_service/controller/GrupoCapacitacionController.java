package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDetalleGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.AgregarPostulacionGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.GrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionDetalleResponse;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionResponse;
import pe.albrugroup.recruitment_service.service.GrupoCapacitacionService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/grupos-capacitacion")
public class GrupoCapacitacionController {

    private final GrupoCapacitacionService grupoCapacitacionService;

    @PostMapping
    public ResponseEntity<GrupoCapacitacionResponse> crearGrupo(@Valid @RequestBody GrupoCapacitacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoCapacitacionService.crearGrupo(request));
    }

    @GetMapping
    public ResponseEntity<List<GrupoCapacitacionResponse>> listarGrupos(
            @RequestParam(required = false) EstadoGrupoCapacitacion estado
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.listarGrupos(estado));
    }

    @GetMapping("/{idGrupoCapacitacion}")
    public ResponseEntity<GrupoCapacitacionResponse> obtenerGrupo(
            @PathVariable @Positive Long idGrupoCapacitacion
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.obtenerGrupo(idGrupoCapacitacion));
    }

    @PostMapping("/{idGrupoCapacitacion}/postulaciones")
    public ResponseEntity<GrupoCapacitacionDetalleResponse> agregarPostulacion(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @Valid @RequestBody AgregarPostulacionGrupoCapacitacionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grupoCapacitacionService.agregarPostulacion(idGrupoCapacitacion, request));
    }

    @PatchMapping("/{idGrupoCapacitacion}/postulaciones/{idPostulacion}")
    public ResponseEntity<GrupoCapacitacionDetalleResponse> actualizarDetalle(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody ActualizarDetalleGrupoCapacitacionRequest request
    ) {
        return ResponseEntity.ok(
                grupoCapacitacionService.actualizarDetalle(idGrupoCapacitacion, idPostulacion, request)
        );
    }
}
