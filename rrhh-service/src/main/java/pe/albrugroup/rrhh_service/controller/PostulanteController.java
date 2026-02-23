package pe.albrugroup.rrhh_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;
import pe.albrugroup.rrhh_service.security.UserSession;
import pe.albrugroup.rrhh_service.usecase.IPostulante;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/postulantes")
public class PostulanteController {

    private final IPostulante postulanteService;

    @PostMapping @PreAuthorize("hasAuthority('CREATE_POSTULANTE')")
    public ResponseEntity<PostulanteResponse> registrarPostulante(@RequestBody RegistrarPostulanteRequest request,
                                                                  @AuthenticationPrincipal UserSession user) {
        var postulante = postulanteService.registrarPostulante(request, user.empleadoId());
        return ResponseEntity.status(HttpStatus.CREATED).body(postulante);
    }
// TODO
//    @GetMapping
//    public ResponseEntity<List<PostulanteResponse>> getPostulantesPorEstadoYFechas(
//            @RequestParam(required = false) EstadoPostulacion estado, @RequestParam(required = false) PuestoTrabajo puesto,
//            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
//            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta)
//    {
//        return ResponseEntity.ok(postulanteService.getPostulantesFiltrados(estado, puesto, desde, hasta));
//    }
//    @PatchMapping
//    public ResponseEntity<List<PostulanteResponse>> actualizarEstadoPostulacion(@RequestBody CambiosEstadoPostulacionRequest request) {
//        var postulante = postulanteService.actualizarEstadosPostulacion(request);
//        return ResponseEntity.ok(postulante);
//    }
//    @PatchMapping("/{id}")
//    public ResponseEntity<PostulanteResponse> actualizarDatosPostulacion(@RequestBody DatosPostulanteRequest request,
//                                                                         @PathVariable @Positive Long id) {
//        var postulante = postulanteService.actulizarPostulante(id, request);
//        return ResponseEntity.ok(postulante);
//    }
}
