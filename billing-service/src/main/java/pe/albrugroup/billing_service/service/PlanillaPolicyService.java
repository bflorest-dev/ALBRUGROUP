package pe.albrugroup.billing_service.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import pe.albrugroup.billing_service.entity.MatrizCalculoPlanilla;
import pe.albrugroup.billing_service.entity.MatrizModalidadPlanilla;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;
import pe.albrugroup.billing_service.exception.BillingException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
public class PlanillaPolicyService {

    public int diasHabiles(YearMonth periodo) {
        int count = 0;
        for (int day = 1; day <= periodo.lengthOfMonth(); day++) {
            if (periodo.atDay(day).getDayOfWeek() != DayOfWeek.SUNDAY) {
                count++;
            }
        }
        return count;
    }

    public int diasHabilesEntre(LocalDate desde, LocalDate hasta) {
        int count = 0;
        LocalDate cursor = desde;
        while (!cursor.isAfter(hasta)) {
            if (cursor.getDayOfWeek() != DayOfWeek.SUNDAY) {
                count++;
            }
            cursor = cursor.plusDays(1);
        }
        return count;
    }

    public BigDecimal pagoDiaHabil(BigDecimal sueldoBasico, int diasHabiles) {
        return sueldoBasico.divide(BigDecimal.valueOf(diasHabiles), 2, RoundingMode.HALF_UP);
    }

    public BigDecimal sueldoAfecto(BigDecimal pagoDiaHabil, int diasValidos) {
        return money(pagoDiaHabil.multiply(BigDecimal.valueOf(diasValidos)));
    }

    public BigDecimal descuentoTardanza(MatrizCalculoPlanilla matriz, int minutosTarde) {
        BigDecimal monto = matriz.getTardanzas().stream()
                .filter(regla -> minutosTarde >= regla.getMinutosDesde() && minutosTarde <= regla.getMinutosHasta())
                .map(regla -> money(regla.getMontoDescuento()))
                .findFirst()
                .orElse(null);
        if (monto != null) {
            return monto;
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal pagoExtras(MatrizCalculoPlanilla matriz, BigDecimal pagoDiaHabil, ModalidadTrabajo modalidad, int minutosExtra) {
        int horasCompletas = Math.floorDiv(Math.max(minutosExtra, 0), 60);
        if (horasCompletas == 0) {
            return money(BigDecimal.ZERO);
        }
        BigDecimal pagoHora = pagoDiaHabil.divide(BigDecimal.valueOf(horasDia(matriz, modalidad)), 2, RoundingMode.HALF_UP);
        return money(pagoHora.multiply(BigDecimal.valueOf(horasCompletas)));
    }

    public int horasDia(MatrizCalculoPlanilla matriz, ModalidadTrabajo modalidad) {
        return modalidadConfig(matriz, modalidad).getHorasDia();
    }

    public BigDecimal bonoPuntualidad(MatrizCalculoPlanilla matriz, ModalidadTrabajo modalidad, int tardanzas) {
        if (tardanzas > 0) {
            return money(BigDecimal.ZERO);
        }
        return money(modalidadConfig(matriz, modalidad).getBonoPuntualidad());
    }

    public BigDecimal bonoProductividad(MatrizCalculoPlanilla matriz, ModalidadTrabajo modalidad, int ventasValidas) {
        MatrizModalidadPlanilla config = modalidadConfig(matriz, modalidad);
        return ventasValidas >= config.getVentasMinimasProductividad() ? money(config.getBonoProductividad()) : money(BigDecimal.ZERO);
    }

    public BigDecimal bonoCapacitacion(MatrizCalculoPlanilla matriz, boolean primerContratoEnMes) {
        return primerContratoEnMes ? money(matriz.getBonoCapacitacion()) : money(BigDecimal.ZERO);
    }

    private MatrizModalidadPlanilla modalidadConfig(MatrizCalculoPlanilla matriz, ModalidadTrabajo modalidad) {
        return matriz.getModalidades().stream()
                .filter(config -> config.getModalidad() == modalidad)
                .findFirst()
                .orElseThrow(() -> new BillingException(HttpStatus.UNPROCESSABLE_ENTITY, "Matriz sin configuracion para modalidad: " + modalidad));
    }

    public static BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
