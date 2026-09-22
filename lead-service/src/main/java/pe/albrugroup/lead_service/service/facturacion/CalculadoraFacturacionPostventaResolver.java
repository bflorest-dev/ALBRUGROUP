package pe.albrugroup.lead_service.service.facturacion;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;
import pe.albrugroup.lead_service.exception.BadRequestException;

import java.util.List;

@Component
@RequiredArgsConstructor
public class CalculadoraFacturacionPostventaResolver {

    private final List<CalculadoraFacturacionPostventa> calculadoras;

    public CalculadoraFacturacionPostventa resolver(TipoReglaFacturacion tipoRegla) {
        return calculadoras.stream()
                .filter(calculadora -> calculadora.soporta(tipoRegla))
                .findFirst()
                .orElseThrow(() -> new BadRequestException(
                        "No existe calculadora de facturacion para el tipo de regla: " + tipoRegla));
    }

    public CalculadoraFacturacionPostventa resolver(Lead lead) {
        TipoReglaFacturacion tipo = resolverTipoRegla(lead);
        if (tipo == null) {
            throw new BadRequestException("El lead no tiene proveedor con tipo de regla de facturacion configurado");
        }
        return resolver(tipo);
    }

    public static TipoReglaFacturacion resolverTipoRegla(Lead lead) {
        Proveedor proveedor = lead.getProveedor();
        if (proveedor == null) {
            proveedor = lead.getProveedorOrigen();
        }
        return proveedor == null ? null : proveedor.getTipoReglaFacturacion();
    }

    public static String resolverNombreProveedor(Lead lead) {
        if (lead.getProveedor() != null) {
            return lead.getProveedor().getNombre();
        }
        if (lead.getProveedorOrigen() != null) {
            return lead.getProveedorOrigen().getNombre();
        }
        return lead.getNombreProveedorSnapshot();
    }
}
