package pe.albrugroup.lead_service.service.facturacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.exception.BadRequestException;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CalculadoraFacturacionPostventaResolver {

    private final List<CalculadoraFacturacionPostventa> calculadoras;

    public CalculadoraFacturacionPostventa resolver(String proveedorSnapshot) {
        return calculadoras.stream()
                .filter(calculadora -> calculadora.soporta(proveedorSnapshot))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("No existe calculadora de facturacion para el proveedor: " + proveedorSnapshot));
    }
}
