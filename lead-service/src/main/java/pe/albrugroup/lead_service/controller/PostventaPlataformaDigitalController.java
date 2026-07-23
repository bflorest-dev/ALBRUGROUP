package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.CredencialPlataformaRequest;
import pe.albrugroup.lead_service.entity.request.EntregaCredencialPlataformaRequest;
import pe.albrugroup.lead_service.entity.request.PaquetePlataformaRequest;
import pe.albrugroup.lead_service.entity.request.PlataformaRequest;
import pe.albrugroup.lead_service.entity.response.CredencialPlataformaResponse;
import pe.albrugroup.lead_service.entity.response.EntregaCredencialDispositivoResponse;
import pe.albrugroup.lead_service.entity.response.EntregaCredencialPlataformaResponse;
import pe.albrugroup.lead_service.entity.response.PaquetePlataformaResponse;
import pe.albrugroup.lead_service.entity.response.PlataformaResponse;
import pe.albrugroup.lead_service.service.PlataformaDigitalPostventaService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/postventa/plataformas-digitales")
public class PostventaPlataformaDigitalController {

    private final PlataformaDigitalPostventaService plataformaDigitalService;

    @PostMapping("/plataformas")
    @PreAuthorize("hasAuthority('CREATE_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<PlataformaResponse> crearPlataforma(@Valid @RequestBody PlataformaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plataformaDigitalService.crearPlataforma(request));
    }

    @GetMapping("/plataformas")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<List<PlataformaResponse>> listarPlataformasActivas() {
        return ResponseEntity.ok(plataformaDigitalService.listarPlataformasActivas());
    }

    @PostMapping("/paquetes")
    @PreAuthorize("hasAuthority('CREATE_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<PaquetePlataformaResponse> crearPaquete(@Valid @RequestBody PaquetePlataformaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plataformaDigitalService.crearPaquete(request));
    }

    @GetMapping("/paquetes")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<List<PaquetePlataformaResponse>> listarPaquetesActivos(@RequestParam Long idPlataforma) {
        return ResponseEntity.ok(plataformaDigitalService.listarPaquetesActivos(idPlataforma));
    }

    @PostMapping("/credenciales")
    @PreAuthorize("hasAuthority('CREATE_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<CredencialPlataformaResponse> crearCredencial(
            @Valid @RequestBody CredencialPlataformaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plataformaDigitalService.crearCredencial(request));
    }

    @GetMapping("/credenciales")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<List<CredencialPlataformaResponse>> listarCredencialesDisponibles(@RequestParam Long idPaquete) {
        return ResponseEntity.ok(plataformaDigitalService.listarCredencialesDisponibles(idPaquete));
    }

    @PostMapping("/leads/{idLead}/entregas")
    @PreAuthorize("hasAuthority('UPDATE_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<EntregaCredencialPlataformaResponse> entregarCredencial(
            @PathVariable Long idLead,
            @Valid @RequestBody EntregaCredencialPlataformaRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(plataformaDigitalService.entregarCredencial(idLead, request));
    }

    @GetMapping("/leads/{idLead}/entregas")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<List<EntregaCredencialPlataformaResponse>> listarEntregasPorLead(@PathVariable Long idLead) {
        return ResponseEntity.ok(plataformaDigitalService.listarEntregasPorLead(idLead));
    }

    @GetMapping("/entregas/{idEntregaCredencial}/dispositivos")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<List<EntregaCredencialDispositivoResponse>> listarDispositivos(
            @PathVariable Long idEntregaCredencial
    ) {
        return ResponseEntity.ok(plataformaDigitalService.listarDispositivos(idEntregaCredencial));
    }

    @GetMapping("/marcas-dispositivo")
    @PreAuthorize("hasAuthority('READ_POSTVENTA_PLATAFORMA_DIGITAL')")
    public ResponseEntity<List<PlataformaResponse>> listarMarcasActivas() {
        return ResponseEntity.ok(plataformaDigitalService.listarMarcasActivasComoCatalogo());
    }
}
