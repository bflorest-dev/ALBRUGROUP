package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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
import pe.albrugroup.recruitment_service.entity.request.ConfirmarContratacionRequest;
import pe.albrugroup.recruitment_service.entity.request.PageRequest;
import pe.albrugroup.recruitment_service.entity.request.PostulacionRequest;
import pe.albrugroup.recruitment_service.entity.request.TipificarPostulacionRequest;
import pe.albrugroup.recruitment_service.entity.response.PageResponse;
import pe.albrugroup.recruitment_service.entity.response.PostulacionResponse;
import pe.albrugroup.recruitment_service.service.PostulacionService;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postulaciones")
public class PostulacionController {

    private final PostulacionService postulacionService;

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_POSTULACIONES')")
    public ResponseEntity<PostulacionResponse> registrarPostulacion(@Valid @RequestBody PostulacionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postulacionService.registrarPostulacion(request));
    }

    @PutMapping("/{idPostulacion}")
    @PreAuthorize("hasAuthority('UPDATE_POSTULACIONES')")
    public ResponseEntity<PostulacionResponse> editarPostulacion(
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody PostulacionRequest request
    ) {
        return ResponseEntity.ok(postulacionService.editarPostulacion(idPostulacion, request));
    }

    @PostMapping("/{idPostulacion}/tipificacion")
    @PreAuthorize("hasAuthority('TYPIFY_POSTULACIONES')")
    public ResponseEntity<PostulacionResponse> tipificarPostulacion(
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody TipificarPostulacionRequest request
    ) {
        return ResponseEntity.ok(postulacionService.tipificarPostulacion(idPostulacion, request));
    }

    @GetMapping("/{idPostulacion}")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public ResponseEntity<PostulacionResponse> obtenerPostulacion(@PathVariable @Positive Long idPostulacion) {
        return ResponseEntity.ok(postulacionService.obtenerPostulacion(idPostulacion));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('READ_POSTULACIONES')")
    public ResponseEntity<PageResponse<PostulacionResponse>> listarPostulaciones(
            @RequestParam(required = false) Etapa etapa,
            @RequestParam(required = false) EstadoPostulacion estado,
            @RequestParam(required = false) EstadoBandejaPostulacion estadoBandeja,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(postulacionService.listarPostulaciones(etapa, estado, estadoBandeja, pageRequest));
    }

    @GetMapping("/bandeja/reclutamiento")
    @PreAuthorize("hasAuthority('READ_POSTULACIONES_RECLUTAMIENTO')")
    public ResponseEntity<PageResponse<PostulacionResponse>> listarBandejaReclutamiento(
            @RequestParam(required = false) EstadoBandejaPostulacion estadoBandeja,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(postulacionService.listarBandejaReclutamiento(estadoBandeja, pageRequest));
    }

    @GetMapping("/bandeja/capacitacion")
    @PreAuthorize("hasAuthority('READ_POSTULACIONES_CAPACITACION')")
    public ResponseEntity<PageResponse<PostulacionResponse>> listarBandejaCapacitacion(
            @RequestParam(required = false) Boolean sinGrupo,
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(postulacionService.listarBandejaCapacitacion(sinGrupo, pageRequest));
    }

    @GetMapping("/bandeja/contratacion")
    @PreAuthorize("hasAuthority('READ_POSTULACIONES')")
    public ResponseEntity<PageResponse<PostulacionResponse>> listarBandejaContratacion(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        return ResponseEntity.ok(postulacionService.listarBandejaContratacion(pageRequest));
    }

    @PostMapping("/{idPostulacion}/confirmar-contratacion")
    @PreAuthorize("hasAuthority('CONFIRM_CONTRATACION_POSTULACIONES')")
    public ResponseEntity<PostulacionResponse> confirmarContratacion(
            @PathVariable @Positive Long idPostulacion,
            @Valid @RequestBody ConfirmarContratacionRequest request
    ) {
        return ResponseEntity.ok(postulacionService.confirmarContratacion(idPostulacion, request));
    }
}
