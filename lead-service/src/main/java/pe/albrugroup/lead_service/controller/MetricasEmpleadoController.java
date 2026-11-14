package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.response.MetricasEmpleadoResponse;
import pe.albrugroup.lead_service.service.MetricasEmpleadoService;

import java.time.YearMonth;

@RestController
@Validated
@RequestMapping("/metricas-empleado")
@RequiredArgsConstructor
public class MetricasEmpleadoController {

    private final MetricasEmpleadoService metricasEmpleadoService;

    @GetMapping("/{idEmpleado}")
    @PreAuthorize("hasAuthority('READ_EMPLEADOS')")
    public ResponseEntity<MetricasEmpleadoResponse> obtener(
            @PathVariable Long idEmpleado,
            @RequestParam(required = false) Integer anio,
            @RequestParam(required = false) Integer mes
    ) {
        YearMonth periodo = OperationalDateTime.resolveMonth(anio, mes);
        return ResponseEntity.ok(metricasEmpleadoService.obtener(idEmpleado, periodo));
    }
}
