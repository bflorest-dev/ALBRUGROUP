package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.service.EquipoProveedorService;

import java.util.Map;

/**
 * Backfill admin: asigna `id_equipo` a los leads existentes según el mapping equipo_proveedor.
 * Se ejecuta una vez tras asignar los proveedores a los equipos. Idempotente y re-ejecutable.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/leads/backfill-equipo")
public class LeadEquipoBackfillController {

    private final EquipoProveedorService equipoProveedorService;

    @PostMapping @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, Integer>> backfillIdEquipo() {
        int actualizados = equipoProveedorService.backfillIdEquipoLeads();
        return ResponseEntity.ok(Map.of("leadsActualizados", actualizados));
    }
}
