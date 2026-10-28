package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.recruitment_service.entity.response.PostulanteHistorialResponse;
import pe.albrugroup.recruitment_service.service.PostulacionService;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postulantes")
public class PostulanteController {

    private final PostulacionService postulacionService;

    @GetMapping("/{idPostulante}/historial")
    @PreAuthorize("hasAuthority('READ_HISTORIAL_POSTULANTES')")
    public ResponseEntity<PostulanteHistorialResponse> obtenerHistorial(
            @PathVariable @Positive Long idPostulante
    ) {
        return ResponseEntity.ok(postulacionService.obtenerHistorialPostulante(idPostulante));
    }
}
