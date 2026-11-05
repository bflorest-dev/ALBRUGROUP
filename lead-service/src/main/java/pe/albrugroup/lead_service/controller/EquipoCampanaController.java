package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.AsignarCampanasEquipoRequest;
import pe.albrugroup.lead_service.entity.request.DistribucionCampanasProveedorRequest;
import pe.albrugroup.lead_service.entity.response.EquipoCampanaResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorCampanasEquipoResponse;
import pe.albrugroup.lead_service.service.EquipoCampanaService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/equipos")
public class EquipoCampanaController {

    private final EquipoCampanaService equipoCampanaService;

    @GetMapping("/campanas/distribucion")
    @PreAuthorize("hasAuthority('READ_EQUIPO_CAMPANAS')")
    public ResponseEntity<List<ProveedorCampanasEquipoResponse>> listarDistribucionesPorProveedor() {
        return ResponseEntity.ok(equipoCampanaService.listarDistribucionesPorProveedor());
    }

    @PutMapping("/campanas/proveedores/{idProveedor}/distribucion")
    @PreAuthorize("hasAuthority('ASSIGN_EQUIPO_CAMPANAS')")
    public ResponseEntity<ProveedorCampanasEquipoResponse> actualizarDistribucionProveedor(
            @PathVariable Long idProveedor,
            @Valid @RequestBody DistribucionCampanasProveedorRequest request
    ) {
        return ResponseEntity.ok(equipoCampanaService.actualizarDistribucionProveedor(idProveedor, request));
    }

    @GetMapping("/{idEquipo}/campanas")
    @PreAuthorize("hasAuthority('READ_EQUIPO_CAMPANAS')")
    public ResponseEntity<List<EquipoCampanaResponse>> listarCampanas(@PathVariable Long idEquipo) {
        return ResponseEntity.ok(equipoCampanaService.listarConfiguracion(idEquipo));
    }

    @PutMapping("/{idEquipo}/campanas")
    @PreAuthorize("hasAuthority('ASSIGN_EQUIPO_CAMPANAS')")
    public ResponseEntity<List<EquipoCampanaResponse>> asignarCampanas(
            @PathVariable Long idEquipo,
            @Valid @RequestBody AsignarCampanasEquipoRequest request
    ) {
        return ResponseEntity.ok(equipoCampanaService.asignarCampanas(idEquipo, request.getCampanaIds()));
    }
}
