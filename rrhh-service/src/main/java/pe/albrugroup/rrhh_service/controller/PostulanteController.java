package pe.albrugroup.rrhh_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.request.CambiosEstadoPostulacionRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

import java.time.LocalDate;
import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postulantes")
public class PostulanteController {

    private final IPostulante postulanteService;

    @GetMapping
    public ResponseEntity<List<PostulanteResponse>> getPostulantesPorEstadoYFechas(
            @RequestParam(required = false) EstadoPostulacion estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta)
    {
        return ResponseEntity.ok(postulanteService.getPostulantesEstadoFechas(estado, desde, hasta));
    }
    @PostMapping
    public ResponseEntity<PostulanteResponse> registrarPostulante(@RequestBody RegistrarPostulanteRequest request) {
        var postulante = postulanteService.registrarPostulante(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(postulante);
    }
    @PatchMapping
    public ResponseEntity<List<PostulanteResponse>> actualizarEstadoPostulacion(@RequestBody CambiosEstadoPostulacionRequest cambios) {
        var postulante = postulanteService.actualizarEstadosPostulacion(cambios);
        return ResponseEntity.ok(postulante);
    }
}
