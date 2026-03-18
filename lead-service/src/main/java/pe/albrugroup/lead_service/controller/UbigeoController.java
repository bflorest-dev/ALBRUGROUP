package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.DepartamentoResponse;
import pe.albrugroup.lead_service.entity.response.DistritoResponse;
import pe.albrugroup.lead_service.entity.response.ProvinciaResponse;
import pe.albrugroup.lead_service.service.UbigeoService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/ubigeo")
public class UbigeoController {

    private final UbigeoService ubigeoService;

    @GetMapping("/departamentos") @PreAuthorize("hasAuthority('READ_UBIGEO')")
    public ResponseEntity<List<DepartamentoResponse>> listarDepartamentos() {
        return ResponseEntity.ok(ubigeoService.listarDepartamentos());
    }

    @GetMapping("/departamentos/{idDepartamento}/provincias") @PreAuthorize("hasAuthority('READ_UBIGEO')")
    public ResponseEntity<List<ProvinciaResponse>> listarProvincias(@PathVariable Long idDepartamento) {
        return ResponseEntity.ok(ubigeoService.listarProvincias(idDepartamento));
    }

    @GetMapping("/provincias/{idProvincia}/distritos") @PreAuthorize("hasAuthority('READ_UBIGEO')")
    public ResponseEntity<List<DistritoResponse>> listarDistritos(@PathVariable Long idProvincia) {
        return ResponseEntity.ok(ubigeoService.listarDistritos(idProvincia));
    }
}
