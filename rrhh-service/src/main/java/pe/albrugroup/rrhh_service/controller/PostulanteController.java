package pe.albrugroup.rrhh_service.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.CambiosEstadoPostulacionRequest;
import pe.albrugroup.rrhh_service.entity.request.DatosPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@Tag(name = "Postulantes", description = "Registra, actualiza estado, y consulta informacion del historial de Postulantes")
@RequestMapping("/postulantes")
public class PostulanteController {

    private final IPostulante postulanteService;

    @Operation(summary = "Listado de Postulantes",
    description = "Obtiene una lista de postulantes filtrada por estado, puesto y rango de fechas. Todos los parámetros son opcionales.")
    @GetMapping
    public ResponseEntity<List<PostulanteResponse>> getPostulantesPorEstadoYFechas(
    @Parameter(description = "Filtrar por estado de postulación", example = "EN_PROCESO", schema = @Schema(implementation = EstadoPostulacion.class))
            @RequestParam(required = false) EstadoPostulacion estado,
    @Parameter(description = "Filtrar por puesto de trabajo", example = "ASESOR_VENTAS", schema = @Schema(implementation = PuestoTrabajo.class))
            @RequestParam(required = false) PuestoTrabajo puesto,
    @Parameter(description = "Fecha inicial del rango (formato: YYYY-MM-DD). Si no se especifica, no se aplica filtro de fecha inicial.", example = "2026-01-01")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
    @Parameter(description = "Fecha final del rango (formato: YYYY-MM-DD). Si no se especifica, no se aplica filtro de fecha final.", example = "2026-02-28")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta
    ) {
        return ResponseEntity.ok(postulanteService.getPostulantesFiltrados(estado, puesto, desde, hasta));
    }

    @Operation(summary = "Registrar un Postulante" ,
    description = "Registra un nuevo postulante con sus datos básicos y objetivo laboral")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Postulante registrado exitosamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos o incompletos")
    })
    @PostMapping
    public ResponseEntity<PostulanteResponse> registrarPostulante(@RequestBody RegistrarPostulanteRequest request) {
        var postulante = postulanteService.registrarPostulante(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(postulante);
    }
    @Operation(summary = "Actualiza el estado de postulacion" ,
            description = "Envia un grupo de Postulantes por su ID + Estado de Postulacion")
    @PatchMapping
    public ResponseEntity<List<PostulanteResponse>> actualizarEstadoPostulacion(@RequestBody CambiosEstadoPostulacionRequest request) {
        var postulante = postulanteService.actualizarEstadosPostulacion(request);
        return ResponseEntity.ok(postulante);
    }
    @PatchMapping("/{id}")
    public ResponseEntity<PostulanteResponse> actualizarDatosPostulacion(@RequestBody DatosPostulanteRequest request,
                                                                         @PathVariable @Positive Long id) {
        var postulante = postulanteService.actulizarPostulante(id, request);
        return ResponseEntity.ok(postulante);
    }
}
