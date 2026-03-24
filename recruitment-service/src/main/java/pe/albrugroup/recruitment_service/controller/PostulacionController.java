package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.request.PostulacionRequest;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.service.PostulacionService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postulaciones")
public class PostulacionController {

    private final PostulacionService postulacionService;

    @PostMapping
    public ResponseEntity<PostulacionResponse> registrarPostulacion(@Valid @RequestBody PostulacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postulacionService.registrarPostulacion(request));
    }

    @PutMapping("/{idPostulacion}")
    public ResponseEntity<PostulacionResponse> editarPostulacion(
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody PostulacionRequest request
    ) {
        return ResponseEntity.ok(postulacionService.editarPostulacion(idPostulacion, request));
    }

    @GetMapping("/{idPostulacion}")
    public ResponseEntity<PostulacionResponse> obtenerPostulacion(@PathVariable @Positive Long idPostulacion) {
        return ResponseEntity.ok(postulacionService.obtenerPostulacion(idPostulacion));
    }

    @GetMapping
    public ResponseEntity<List<PostulacionResponse>> listarPostulaciones(
            @RequestParam(required = false) Etapa etapa,
            @RequestParam(required = false) EstadoPostulacion estado,
            @RequestParam(required = false) EstadoBandejaPostulacion estadoBandeja
    ) {
        return ResponseEntity.ok(postulacionService.listarPostulaciones(etapa, estado, estadoBandeja));
    }

    @GetMapping("/activas")
    public ResponseEntity<List<PostulacionResponse>> listarPostulacionesActivas(
            @RequestParam(required = false) Etapa etapa,
            @RequestParam(required = false) EstadoBandejaPostulacion estadoBandeja
    ) {
        return ResponseEntity.ok(postulacionService.listarPostulacionesActivas(etapa, estadoBandeja));
    }
}
