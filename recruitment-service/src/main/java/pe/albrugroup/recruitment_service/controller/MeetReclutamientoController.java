package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.response.HorarioMeetResponse;
import pe.albrugroup.recruitment_service.entity.response.SesionMeetResponse;
import pe.albrugroup.recruitment_service.service.MeetReclutamientoService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/reclutamiento/meet")
public class MeetReclutamientoController {

    private final MeetReclutamientoService service;

    @GetMapping("/horarios")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public List<HorarioMeetResponse> listarHorarios(@RequestParam Negocio negocio) {
        return service.listarHorarios(negocio);
    }

    @GetMapping("/sesiones")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public List<SesionMeetResponse> listarSesiones(
            @RequestParam(required = false) LocalDate fecha,
            @RequestParam(required = false) Negocio negocio
    ) {
        return service.listarSesiones(fecha, negocio);
    }

    @GetMapping("/sesiones/{id}")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public SesionMeetResponse obtenerSesion(@PathVariable @Positive Long id) {
        return service.obtenerSesion(id);
    }
}
