package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDetalleGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.AgregarPostulacionGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.GrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionDetalleResponse;
import pe.albrugroup.recruitment_service.entity.response.GrupoCapacitacionResponse;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.service.GrupoCapacitacionService;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/grupos-capacitacion")
public class GrupoCapacitacionController {

    private final GrupoCapacitacionService grupoCapacitacionService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionResponse> crearGrupo(@Valid @RequestBody GrupoCapacitacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoCapacitacionService.crearGrupo(request));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('READ_GRUPOS_CAPACITACION')")
    public ResponseEntity<PageResponse<GrupoCapacitacionResponse>> listarGrupos(
            @RequestParam(required = false) EstadoGrupoCapacitacion estado,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.listarGrupos(estado, pageRequest));
    }

    @GetMapping("/{idGrupoCapacitacion}")
    @PreAuthorize("hasAuthority('READ_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionResponse> obtenerGrupo(
            @PathVariable @Positive Long idGrupoCapacitacion
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.obtenerGrupo(idGrupoCapacitacion));
    }

    @PostMapping("/{idGrupoCapacitacion}/postulaciones")
    @PreAuthorize("hasAuthority('ASSIGN_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionDetalleResponse> agregarPostulacion(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @Valid @RequestBody AgregarPostulacionGrupoCapacitacionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grupoCapacitacionService.agregarPostulacion(idGrupoCapacitacion, request));
    }

    @PatchMapping("/{idGrupoCapacitacion}/postulaciones/{idPostulacion}")
    @PreAuthorize("hasAuthority('UPDATE_GRUPOS_CAPACITACION')")
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
