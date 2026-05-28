package pe.albrugroup.call_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/")
public class HealthController {

    @GetMapping
    public Map<String, Object> root() {
        return Map.of(
                "service", "call-service",
                "status", "UP",
                "timestamp", Instant.now().toString()
        );
    }
}
