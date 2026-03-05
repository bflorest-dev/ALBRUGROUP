package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.service.TipificacionService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/tipificaciones")
public class TipificacionController {

    private final TipificacionService service;

    @GetMapping("/{etapa}/catalogo")
    public ResponseEntity<CatalogoResponse> getCatalogo(@PathVariable Etapa etapa) {
        var catalogo = service.getCatalogoPorEtapa(etapa);
        return ResponseEntity.ok(catalogo);
    }

}
