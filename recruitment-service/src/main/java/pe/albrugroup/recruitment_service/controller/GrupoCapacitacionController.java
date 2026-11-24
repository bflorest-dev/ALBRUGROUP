package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.EstadoGrupoCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.request.ActualizarDetalleGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.ActualizarResultadoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.AgregarPostulacionGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.AsignarPostulacionesGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.GrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.ReprogramarGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TrasladarPostulacionesGrupoCapacitacionRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;

import java.time.LocalDate;
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
            @RequestParam Negocio negocio,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.listarGrupos(estado, negocio, pageRequest));
    }

    @GetMapping("/agenda")
    @PreAuthorize("hasAuthority('READ_GRUPOS_CAPACITACION')")
    public ResponseEntity<java.util.List<GrupoCapacitacionResponse>> listarAgenda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.listarAgenda(desde, hasta, negocio));
    }

    @GetMapping("/{idGrupoCapacitacion}")
    @PreAuthorize("hasAuthority('READ_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionResponse> obtenerGrupo(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.obtenerGrupo(idGrupoCapacitacion, negocio));
    }

    @PostMapping("/{idGrupoCapacitacion:\\d+}:reprogramar")
    @PreAuthorize("hasAuthority('UPDATE_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionResponse> reprogramarGrupo(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @Valid @RequestBody ReprogramarGrupoCapacitacionRequest request,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.ok(
                grupoCapacitacionService.reprogramarGrupo(idGrupoCapacitacion, request.getFechaInicio(), negocio)
        );
    }

    @PostMapping("/{idGrupoCapacitacion}/postulaciones")
    @PreAuthorize("hasAuthority('ASSIGN_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionDetalleResponse> agregarPostulacion(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @Valid @RequestBody AgregarPostulacionGrupoCapacitacionRequest request,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grupoCapacitacionService.agregarPostulacion(idGrupoCapacitacion, request, negocio));
    }

    @PostMapping("/{idGrupoCapacitacion}/postulaciones:asignar")
    @PreAuthorize("hasAuthority('ASSIGN_GRUPOS_CAPACITACION')")
    public ResponseEntity<java.util.List<GrupoCapacitacionDetalleResponse>> asignarPostulaciones(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @Valid @RequestBody AsignarPostulacionesGrupoCapacitacionRequest request,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                grupoCapacitacionService.agregarPostulaciones(idGrupoCapacitacion, request.getIdsPostulaciones(), negocio)
        );
    }

    @PostMapping("/{idGrupoDestino}/postulaciones:mover")
    @PreAuthorize("hasAuthority('ASSIGN_GRUPOS_CAPACITACION')")
    public ResponseEntity<java.util.List<GrupoCapacitacionDetalleResponse>> trasladarPostulaciones(
            @PathVariable @Positive Long idGrupoDestino,
            @Valid @RequestBody TrasladarPostulacionesGrupoCapacitacionRequest request,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.ok(grupoCapacitacionService.trasladarPostulaciones(
                idGrupoDestino, request.getIdGrupoOrigen(), request.getIdsPostulaciones(), negocio
        ));
    }

    @DeleteMapping("/{idGrupoCapacitacion}/postulaciones/{idPostulacion}")
    @PreAuthorize("hasAuthority('ASSIGN_GRUPOS_CAPACITACION')")
    public ResponseEntity<Void> retirarPostulacion(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @PathVariable @Positive Long idPostulacion,
            @RequestParam Negocio negocio
    ) {
        grupoCapacitacionService.retirarPostulacion(idGrupoCapacitacion, idPostulacion, negocio);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{idGrupoCapacitacion}/postulaciones/{idPostulacion}")
    @PreAuthorize("hasAuthority('UPDATE_GRUPOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionDetalleResponse> actualizarDetalle(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody ActualizarDetalleGrupoCapacitacionRequest request,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.ok(
                grupoCapacitacionService.actualizarDetalle(idGrupoCapacitacion, idPostulacion, request, negocio)
        );
    }

    @PatchMapping("/{idGrupoCapacitacion}/postulaciones/{idPostulacion}:resultado")
    @PreAuthorize("hasAuthority('UPDATE_RESULTADOS_CAPACITACION')")
    public ResponseEntity<GrupoCapacitacionDetalleResponse> actualizarResultadoCapacitacion(
            @PathVariable @Positive Long idGrupoCapacitacion,
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody ActualizarResultadoCapacitacionRequest request,
            @RequestParam Negocio negocio
    ) {
        return ResponseEntity.ok(
                grupoCapacitacionService.actualizarResultadoCapacitacion(
                        idGrupoCapacitacion, idPostulacion, request, negocio
                )
        );
    }
}
