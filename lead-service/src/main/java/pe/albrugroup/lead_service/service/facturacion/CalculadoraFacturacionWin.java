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
public class CalculadoraFacturacionWin implements CalculadoraFacturacionPostventa {

    private static final int DIA_FRONTERA_BLOQUE = 23;
    private static final int DIA_MAXIMO_BLOQUE_MISMO_MES = 22;
    private static final int DIA_VENCIMIENTO = 28;

    @Override
    public boolean soporta(String proveedorSnapshot) {
        return proveedorSnapshot != null && proveedorSnapshot.trim().equalsIgnoreCase("WIN");
    }

    @Override
    public CalendarioFacturacionPostventa crearCalendario(Lead lead, LocalDate fechaInstalacion) {
        BloqueFacturacion bloque = fechaInstalacion.getDayOfMonth() <= DIA_MAXIMO_BLOQUE_MISMO_MES
                ? BloqueFacturacion.MISMO_MES
                : BloqueFacturacion.MES_SIGUIENTE;

        return CalendarioFacturacionPostventa.builder()
                .lead(lead)
                .fechaInstalacion(fechaInstalacion)
                .proveedorSnapshot(lead.getNombreProveedorSnapshot())
                .planSnapshot(lead.getNombrePlanSnapshot())
                .mesesPermanenciaSnapshot(lead.getMesesPermanenciaSnapshot())
                .montoPlanSnapshot(lead.getPrecioFinal())
                .tipoReglaProveedor(TipoReglaFacturacion.WIN)
                .diaCorte(DIA_FRONTERA_BLOQUE)
                .diaVencimiento(DIA_VENCIMIENTO)
                .bloqueFacturacion(bloque)
                .requiereProrrateoInicial(true)
                .activo(true)
                .build();
    }

    @Override
    public PeriodoFacturacionPostventa crearPeriodo(CalendarioFacturacionPostventa calendario, int numeroPeriodo) {
        LocalDate vencimientoPrimerPeriodo = resolverPrimerVencimiento(calendario);
        LocalDate vencimiento = vencimientoPrimerPeriodo.plusMonths(numeroPeriodo - 1L);
        LocalDate corte = ajustarDia(vencimiento.getYear(), vencimiento.getMonthValue(), DIA_FRONTERA_BLOQUE);

        return PeriodoFacturacionPostventa.builder()
                .calendarioFacturacionPostventa(calendario)
                .lead(calendario.getLead())
                .numeroPeriodo(numeroPeriodo)
                .fechaInicioPeriodo(numeroPeriodo == 1 ? calendario.getFechaInstalacion() : vencimiento.minusMonths(1).plusDays(1))
                .fechaFinPeriodo(vencimiento)
                .fechaCorteEstimada(corte)
                .fechaVencimientoEstimado(vencimiento)
                .montoEsperado(calendario.getMontoPlanSnapshot())
                .estado(EstadoPeriodoFacturacionPostventa.PROGRAMADO)
                .build();
    }

    private LocalDate resolverPrimerVencimiento(CalendarioFacturacionPostventa calendario) {
        LocalDate instalacion = calendario.getFechaInstalacion();
        YearMonth mesVencimiento = calendario.getBloqueFacturacion() == BloqueFacturacion.MES_SIGUIENTE
                ? YearMonth.from(instalacion).plusMonths(1)
                : YearMonth.from(instalacion);
        return mesVencimiento.atDay(Math.min(DIA_VENCIMIENTO, mesVencimiento.lengthOfMonth()));
    }

    private LocalDate ajustarDia(int year, int month, int day) {
        YearMonth yearMonth = YearMonth.of(year, month);
        return yearMonth.atDay(Math.min(day, yearMonth.lengthOfMonth()));
    }
}
