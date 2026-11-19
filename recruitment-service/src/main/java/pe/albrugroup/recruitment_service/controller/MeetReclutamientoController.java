package pe.albrugroup.recruitment_service.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.response.HorarioMeetResponse;
import pe.albrugroup.recruitment_service.entity.response.MeetBatchResponse;
import pe.albrugroup.recruitment_service.entity.response.SesionMeetResponse;
import pe.albrugroup.recruitment_service.entity.request.MeetAsistenciaBatchRequest;
import pe.albrugroup.recruitment_service.entity.request.MeetEvaluacionBatchRequest;
import pe.albrugroup.recruitment_service.service.GestionReclutamientoService;
import pe.albrugroup.recruitment_service.service.MeetReclutamientoService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/reclutamiento/meet")
public class MeetReclutamientoController {

    private final MeetReclutamientoService service;
    private final GestionReclutamientoService gestionService;

    @GetMapping("/horarios")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public List<HorarioMeetResponse> listarHorarios(@RequestParam Negocio negocio) {
        return service.listarHorarios(negocio);
    }

    @GetMapping("/sesiones")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public List<SesionMeetResponse> listarSesiones(
            @RequestParam(required = false) LocalDate fecha,
            @RequestParam(required = false) LocalDate desde,
            @RequestParam(required = false) LocalDate hasta,
            @RequestParam Negocio negocio,
            @RequestParam(required = false) String estado
    ) {
        LocalDate desdeConsulta = desde != null ? desde : fecha;
        LocalDate hastaConsulta = hasta != null ? hasta : fecha;
        return service.listarSesiones(desdeConsulta, hastaConsulta, negocio, estado);
    }

    @GetMapping("/sesiones/{id}")
    @PreAuthorize("hasAuthority('READ_POSTULACION')")
    public SesionMeetResponse obtenerSesion(@PathVariable @Positive Long id, @RequestParam Negocio negocio) {
        return service.obtenerSesion(id, negocio);
    }

    @PostMapping("/sesiones/{idSesion}/asistencia:batch")
    @PreAuthorize("hasAuthority('TYPIFY_POSTULACIONES')")
    public MeetBatchResponse registrarAsistenciaBatch(
            @PathVariable @Positive Long idSesion,
            @RequestParam Negocio negocio,
            @Valid @RequestBody MeetAsistenciaBatchRequest request
    ) {
        return gestionService.registrarAsistenciaBatch(idSesion, negocio, request);
    }

    @PostMapping("/sesiones/{idSesion}/evaluacion:batch")
    @PreAuthorize("hasAuthority('TYPIFY_POSTULACIONES')")
    public MeetBatchResponse registrarEvaluacionBatch(
            @PathVariable @Positive Long idSesion,
            @RequestParam Negocio negocio,
            @Valid @RequestBody MeetEvaluacionBatchRequest request
    ) {
        return gestionService.registrarEvaluacionBatch(idSesion, negocio, request);
    }
}
