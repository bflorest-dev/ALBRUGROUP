package pe.albrugroup.lead_service.service.facturacion;

import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.BloqueFacturacion;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.LocalDate;

@Component
public class CalculadoraFacturacionClaro implements CalculadoraFacturacionPostventa {

    private static final int DIAS_HASTA_VENCIMIENTO = 15;

    @Override
    public boolean soporta(String proveedorSnapshot) {
        return proveedorSnapshot != null && proveedorSnapshot.trim().equalsIgnoreCase("CLARO");
    }

    @Override
    public CalendarioFacturacionPostventa crearCalendario(Lead lead, LocalDate fechaInstalacion) {
        LocalDate primerVencimiento = fechaInstalacion.plusDays(DIAS_HASTA_VENCIMIENTO);

        return CalendarioFacturacionPostventa.builder()
                .lead(lead)
                .fechaInstalacion(fechaInstalacion)
                .proveedorSnapshot(lead.getNombreProveedorSnapshot())
                .planSnapshot(lead.getNombrePlanSnapshot())
                .mesesPermanenciaSnapshot(lead.getMesesPermanenciaSnapshot())
                .montoPlanSnapshot(lead.getPrecioFinal())
                .tipoReglaProveedor(TipoReglaFacturacion.CLARO)
                .diaCorte(fechaInstalacion.getDayOfMonth())
                .diaEmisionEstimado(fechaInstalacion.getDayOfMonth())
                .diaVencimiento(primerVencimiento.getDayOfMonth())
                .bloqueFacturacion(BloqueFacturacion.DIA_INSTALACION)
                .requiereProrrateoInicial(true)
                .activo(true)
                .build();
    }

    @Override
    public PeriodoFacturacionPostventa crearPeriodo(CalendarioFacturacionPostventa calendario, int numeroPeriodo) {
        LocalDate emision = calendario.getFechaInstalacion().plusMonths(numeroPeriodo - 1L);
        LocalDate vencimiento = calendario.getFechaInstalacion()
                .plusDays(DIAS_HASTA_VENCIMIENTO)
                .plusMonths(numeroPeriodo - 1L);

        return PeriodoFacturacionPostventa.builder()
                .calendarioFacturacionPostventa(calendario)
                .lead(calendario.getLead())
                .numeroPeriodo(numeroPeriodo)
                .fechaInicioPeriodo(emision)
                .fechaFinPeriodo(vencimiento)
                .fechaCorteEstimada(emision)
                .fechaEmisionEstimada(emision)
                .fechaVencimientoEstimado(vencimiento)
                .montoEsperado(calendario.getMontoPlanSnapshot())
                .estado(EstadoPeriodoFacturacionPostventa.ABIERTO)
                .build();
    }
}
