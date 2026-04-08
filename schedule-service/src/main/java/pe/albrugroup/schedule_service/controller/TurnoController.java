package pe.albrugroup.schedule_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/turnos")
public class TurnoController {

    @PostMapping
    public ResponseEntity<?> registrarHorario() {
        // TODO
        return ResponseEntity.ok().build();
    }
}
