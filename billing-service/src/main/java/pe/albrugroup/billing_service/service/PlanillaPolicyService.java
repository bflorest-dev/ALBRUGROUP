package pe.albrugroup.billing_service.service;

import org.springframework.stereotype.Service;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;

@Service
public class PlanillaPolicyService {

    private static final BigDecimal PRODUCTIVIDAD = money("100.00");
    private static final BigDecimal CAPACITACION = money("50.00");

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

    public BigDecimal descuentoTardanza(int minutosTarde) {
        if (minutosTarde >= 5 && minutosTarde <= 9) {
            return money("5.00");
        }
        if (minutosTarde >= 10 && minutosTarde <= 20) {
            return money("10.00");
        }
        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal pagoExtras(BigDecimal pagoDiaHabil, ModalidadTrabajo modalidad, int minutosExtra) {
        int horasCompletas = Math.floorDiv(Math.max(minutosExtra, 0), 60);
        if (horasCompletas == 0) {
            return money(BigDecimal.ZERO);
        }
        BigDecimal pagoHora = pagoDiaHabil.divide(BigDecimal.valueOf(horasDia(modalidad)), 2, RoundingMode.HALF_UP);
        return money(pagoHora.multiply(BigDecimal.valueOf(horasCompletas)));
    }

    public int horasDia(ModalidadTrabajo modalidad) {
        return switch (modalidad) {
            case PARTTIME -> 4;
            case SEMIFULLTIME -> 6;
            case FULLTIME -> 8;
            case SUPERFULLTIME -> 10;
        };
    }

    public BigDecimal bonoPuntualidad(ModalidadTrabajo modalidad, int tardanzas) {
        if (tardanzas > 0) {
            return money(BigDecimal.ZERO);
        }
        return modalidad == ModalidadTrabajo.PARTTIME ? money("50.00") : money("100.00");
    }

    public BigDecimal bonoProductividad(ModalidadTrabajo modalidad, int ventasValidas) {
        return ventasValidas >= ventasMinimas(modalidad) ? PRODUCTIVIDAD : money(BigDecimal.ZERO);
    }

    public BigDecimal bonoCapacitacion(boolean primerContratoEnMes) {
        return primerContratoEnMes ? CAPACITACION : money(BigDecimal.ZERO);
    }

    public int ventasMinimas(ModalidadTrabajo modalidad) {
        return switch (modalidad) {
            case PARTTIME -> 30;
            case SEMIFULLTIME -> 40;
            case FULLTIME, SUPERFULLTIME -> 60;
        };
    }

    public static BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
