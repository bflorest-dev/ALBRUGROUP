package pe.albrugroup.lead_service.service.facturacion;

import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.LocalDate;

public interface CalculadoraFacturacionPostventa {

    boolean soporta(TipoReglaFacturacion tipoRegla);

    CalendarioFacturacionPostventa crearCalendario(Lead lead, LocalDate fechaInstalacion);

    PeriodoFacturacionPostventa crearPeriodo(CalendarioFacturacionPostventa calendario, int numeroPeriodo);
}
