package pe.albrugroup.schedule_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/asistencia")
public class AsistenciaController {

    @PostMapping("/ingreso")
    public ResponseEntity<?> registrarIngresoDiario() {
        // TODO
        return ResponseEntity.ok().build();
    }

    @PostMapping("/salida")
    public ResponseEntity<?> registrarSalidaDiaria() {
        // TODO
        return ResponseEntity.ok().build();
    }

    @GetMapping("/resumen")
    public ResponseEntity<?> verResumenMensual() {
        return ResponseEntity.ok().build();
    }
}
