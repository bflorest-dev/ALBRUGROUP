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
        CorteWin corte = resolverCorteDesdeInstalacion(fechaInstalacion);

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
                .mesCorteBase(corte.mesCorteBase())
                .numeroCorteBase(corte.numeroCorteBase())
                .bloqueFacturacion(corte.bloqueFacturacion())
                .requiereProrrateoInicial(true)
                .activo(true)
                .build();
    }

    @Override
    public PeriodoFacturacionPostventa crearPeriodo(CalendarioFacturacionPostventa calendario, int numeroPeriodo) {
        LocalDate vencimientoPrimerPeriodo = resolverPrimerVencimiento(calendario);
        LocalDate vencimiento = vencimientoPrimerPeriodo.plusMonths(numeroPeriodo - 1L);
        LocalDate corte = ajustarDia(vencimiento.getYear(), vencimiento.getMonthValue(), DIA_FRONTERA_BLOQUE);
        LocalDate inicio = numeroPeriodo == 1
                ? resolverInicioPrimerPeriodo(calendario)
                : vencimiento.minusMonths(1).plusDays(1);

        return PeriodoFacturacionPostventa.builder()
                .calendarioFacturacionPostventa(calendario)
                .lead(calendario.getLead())
                .numeroPeriodo(numeroPeriodo)
                .fechaInicioPeriodo(inicio)
                .fechaFinPeriodo(vencimiento)
                .fechaCorteEstimada(corte)
                .fechaVencimientoEstimado(vencimiento)
                .montoEsperado(calendario.getMontoPlanSnapshot())
                .estado(EstadoPeriodoFacturacionPostventa.PROGRAMADO)
                .build();
    }

    private LocalDate resolverPrimerVencimiento(CalendarioFacturacionPostventa calendario) {
        if (calendario.getMesCorteBase() != null && calendario.getNumeroCorteBase() != null) {
            LocalDate mesCorte = calendario.getMesCorteBase();
            YearMonth mesVencimiento = calendario.getNumeroCorteBase() == 2
                    ? YearMonth.from(mesCorte).plusMonths(1)
                    : YearMonth.from(mesCorte);
            return mesVencimiento.atDay(Math.min(DIA_VENCIMIENTO, mesVencimiento.lengthOfMonth()));
        }
        LocalDate instalacion = calendario.getFechaInstalacion();
        YearMonth mesVencimiento = calendario.getBloqueFacturacion() == BloqueFacturacion.MES_SIGUIENTE
                ? YearMonth.from(instalacion).plusMonths(1)
                : YearMonth.from(instalacion);
        return mesVencimiento.atDay(Math.min(DIA_VENCIMIENTO, mesVencimiento.lengthOfMonth()));
    }

    private LocalDate resolverInicioPrimerPeriodo(CalendarioFacturacionPostventa calendario) {
        if (calendario.getMesCorteBase() != null && calendario.getNumeroCorteBase() != null) {
            return calendario.getNumeroCorteBase() == 2
                    ? calendario.getMesCorteBase().withDayOfMonth(DIA_FRONTERA_BLOQUE)
                    : calendario.getMesCorteBase();
        }
        return calendario.getFechaInstalacion();
    }

    private LocalDate ajustarDia(int year, int month, int day) {
        YearMonth yearMonth = YearMonth.of(year, month);
        return yearMonth.atDay(Math.min(day, yearMonth.lengthOfMonth()));
    }

    private CorteWin resolverCorteDesdeInstalacion(LocalDate fechaInstalacion) {
        boolean mismoMes = fechaInstalacion.getDayOfMonth() <= DIA_MAXIMO_BLOQUE_MISMO_MES;
        return new CorteWin(
                YearMonth.from(fechaInstalacion).atDay(1),
                mismoMes ? 1 : 2,
                mismoMes ? BloqueFacturacion.MISMO_MES : BloqueFacturacion.MES_SIGUIENTE
        );
    }

    private record CorteWin(LocalDate mesCorteBase, Integer numeroCorteBase, BloqueFacturacion bloqueFacturacion) {
    }
}
