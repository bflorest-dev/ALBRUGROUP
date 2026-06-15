package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.AsignarProveedoresRequest;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.service.EquipoProveedorService;

import java.util.List;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/equipos/{idEquipo}/proveedores")
public class EquipoProveedorController {

    private final EquipoProveedorService equipoProveedorService;

    @PutMapping @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ProveedorResponse>> asignarProveedores(
            @PathVariable Long idEquipo,
            @Valid @RequestBody AsignarProveedoresRequest request
    ) {
        return ResponseEntity.ok(equipoProveedorService.asignarProveedores(idEquipo, request.getProveedorIds()));
    }

    @GetMapping @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<List<ProveedorResponse>> listarProveedoresDeEquipo(@PathVariable Long idEquipo) {
        return ResponseEntity.ok(equipoProveedorService.listarProveedoresDeEquipo(idEquipo));
    }
}
