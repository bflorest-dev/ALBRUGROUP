package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.TipoDomicilioResponse;
import pe.albrugroup.lead_service.service.DireccionCatalogoService;

import java.util.List;

@RestController
@Validated
@RequiredArgsConstructor
@RequestMapping("/direccion/catalogo")
public class DireccionCatalogoController {

    private final DireccionCatalogoService direccionCatalogoService;

    @GetMapping("/tipos-domicilio")
    @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<List<TipoDomicilioResponse>> listarTiposDomicilio(@RequestParam Long idProveedor) {
        return ResponseEntity.ok(direccionCatalogoService.listarTiposDomicilio(idProveedor));
    }

    @GetMapping("/tipos-urbanizacion")
    @PreAuthorize("hasAuthority('READ_LEADS_ASESOR')")
    public ResponseEntity<List<String>> listarTiposUrbanizacion() {
        return ResponseEntity.ok(direccionCatalogoService.listarTiposUrbanizacion());
    }
}
