package pe.albrugroup.rrhh_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.postulante.EstadoCapacitacionRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.EventoPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postulantes")
public class PostulanteController {

    private final IPostulante postulanteService;

    @PostMapping @PreAuthorize("hasAuthority('CREATE_POSTULANTES')")
    public ResponseEntity<PostulanteResponse> registrarPostulante(@RequestBody RegistrarPostulanteRequest request) {
        var postulante = postulanteService.registrarPostulante(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(postulante);
    }
    @GetMapping("/reclutamiento") @PreAuthorize("hasAuthority('READ_POSTULANTES')")
    public ResponseEntity<List<PostulanteResponse>> listarPostulantesReclutamiento(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String subestado,
            @RequestParam(required = false) Origen origen,
            @RequestParam(required = false) PuestoTrabajo puesto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Boolean listaNegra
    ) {
        var postulantes = postulanteService.getPostulantesFiltrados(
                EtapaProceso.RECLUTAMIENTO, estado, subestado, origen, puesto, desde, hasta, listaNegra
        );
        return ResponseEntity.ok(postulantes);
    }

    @GetMapping("/capacitacion") @PreAuthorize("hasAuthority('READ_RECLUTADOS')")
    public ResponseEntity<List<PostulanteResponse>> listarPostulantesCapacitacion(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String subestado,
            @RequestParam(required = false) Origen origen,
            @RequestParam(required = false) PuestoTrabajo puesto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Boolean listaNegra
    ) {
        var postulantes = postulanteService.getPostulantesFiltrados(
                EtapaProceso.CAPACITACION, estado, subestado, origen, puesto, desde, hasta, listaNegra
        );
        return ResponseEntity.ok(postulantes);
    }

    @GetMapping
    public ResponseEntity<List<PostulanteResponse>> listarPostulantesPorEtapa(
            @RequestParam EtapaProceso etapa,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String subestado,
            @RequestParam(required = false) Origen origen,
            @RequestParam(required = false) PuestoTrabajo puesto,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Boolean listaNegra
    ) {
        var postulantes = postulanteService.getPostulantesFiltrados(
                etapa, estado, subestado, origen, puesto, desde, hasta, listaNegra
        );
        return ResponseEntity.ok(postulantes);
    }
    @PatchMapping("/{id}/estado-reclutamiento") @PreAuthorize("hasAuthority('TYPIFY_POSTULANTES')")
    public ResponseEntity<PostulanteResponse> actualizarEstadoReclutamiento(@RequestBody EventoPostulanteRequest request,
                                                                            @PathVariable @Positive Long id) {
        var postulante = postulanteService.actualizarEstadoReclutamiento(id, request);
        return ResponseEntity.ok(postulante);
    }
    @PatchMapping("/estado-capacitacion") @PreAuthorize("hasAuthority('TYPIFY_RECLUTADOS')")
    public ResponseEntity<List<PostulanteResponse>> actualizarEstadoCapacitacion(@RequestBody List<EstadoCapacitacionRequest> request) {
        var postulantes = postulanteService.actualizarEstadosCapacitacion(request);
        return ResponseEntity.ok(postulantes);
    }
}
