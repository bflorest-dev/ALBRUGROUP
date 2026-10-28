package pe.albrugroup.recruitment_service.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.request.GestionReclutamientoRequest;
import pe.albrugroup.recruitment_service.entity.response.GestionReclutamientoResponse;
import pe.albrugroup.recruitment_service.service.GestionReclutamientoService;

@RestController @RequiredArgsConstructor
@RequestMapping("/postulaciones/{id}/gestion-reclutamiento")
public class GestionReclutamientoController {
 private final GestionReclutamientoService service;
 @GetMapping @PreAuthorize("hasAuthority('READ_POSTULACION')")
 public GestionReclutamientoResponse obtener(@PathVariable Long id) { return service.obtener(id); }
 @PostMapping @PreAuthorize("hasAuthority('TYPIFY_POSTULACIONES')")
 public GestionReclutamientoResponse registrar(@PathVariable Long id,@Valid @RequestBody GestionReclutamientoRequest request) {
  return service.registrar(id,request);
 }
}
