package pe.albrugroup.lead_service.service.facturacion;

import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.BloqueFacturacion;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.LocalDate;
import java.time.YearMonth;

@Component
public class CalculadoraFacturacionClaro implements CalculadoraFacturacionPostventa {

    private static final int DIA_INICIO_CORTE_UNO = 1;
    private static final int DIA_INICIO_CORTE_DOS = 12;
    private static final int DIAS_HASTA_VENCIMIENTO = 15;

    @Override
    public boolean soporta(String proveedorSnapshot) {
        return proveedorSnapshot != null && proveedorSnapshot.trim().equalsIgnoreCase("CLARO");
    }

    @Override
    public CalendarioFacturacionPostventa crearCalendario(Lead lead, LocalDate fechaInstalacion) {
        LocalDate primerVencimiento = fechaInstalacion.plusDays(DIAS_HASTA_VENCIMIENTO);
        CorteClaro corte = resolverCorteDesdeInstalacion(fechaInstalacion);

        return CalendarioFacturacionPostventa.builder()
                .lead(lead)
                .fechaInstalacion(fechaInstalacion)
                .proveedorSnapshot(lead.getNombreProveedorSnapshot())
                .planSnapshot(lead.getNombrePlanSnapshot())
                .mesesPermanenciaSnapshot(lead.getMesesPermanenciaSnapshot())
                .montoPlanSnapshot(lead.getPrecioFinal())
                .tipoReglaProveedor(TipoReglaFacturacion.CLARO)
                .diaCorte(corte.diaCorte())
                .diaEmisionEstimado(fechaInstalacion.getDayOfMonth())
                .diaVencimiento(primerVencimiento.getDayOfMonth())
                .mesCorteBase(corte.mesCorteBase())
                .numeroCorteBase(corte.numeroCorteBase())
                .bloqueFacturacion(corte.bloqueFacturacion())
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

    private CorteClaro resolverCorteDesdeInstalacion(LocalDate fechaInstalacion) {
        boolean segundoCorte = fechaInstalacion.getDayOfMonth() >= DIA_INICIO_CORTE_DOS;
        return new CorteClaro(
                YearMonth.from(fechaInstalacion).atDay(1),
                segundoCorte ? 2 : 1,
                segundoCorte ? DIA_INICIO_CORTE_DOS : DIA_INICIO_CORTE_UNO,
                segundoCorte ? BloqueFacturacion.MES_SIGUIENTE : BloqueFacturacion.MISMO_MES
        );
    }

    private record CorteClaro(
            LocalDate mesCorteBase,
            Integer numeroCorteBase,
            Integer diaCorte,
            BloqueFacturacion bloqueFacturacion
    ) {
    }
}
