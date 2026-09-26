package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.response.OrigenResponse;
import pe.albrugroup.lead_service.service.OrigenService;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/origenes")
public class OrigenController {

    private final OrigenService origenService;

    @GetMapping
    public ResponseEntity<List<OrigenResponse>> listar() {
        return ResponseEntity.ok(origenService.listarActivos());
    }
}
