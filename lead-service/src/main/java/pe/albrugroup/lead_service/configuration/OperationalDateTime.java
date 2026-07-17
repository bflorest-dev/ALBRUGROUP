package pe.albrugroup.lead_service.configuration;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;

public final class OperationalDateTime {

    public static final ZoneId ZONE = ZoneId.of("America/Lima");

    private OperationalDateTime() {
    }

    public static Instant now() {
        return Instant.now();
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static YearMonth currentMonth() {
        return YearMonth.now(ZONE);
    }

    public static LocalDate resolveDate(LocalDate date) {
        return date == null ? today() : date;
    }

    public static YearMonth resolveMonth(Integer year, Integer month) {
        if (year == null || month == null) {
            return currentMonth();
        }
        return YearMonth.of(year, month);
    }

    public static Instant startOfDay(LocalDate date) {
        return date.atStartOfDay(ZONE).toInstant();
    }

    public static Instant endExclusiveOfDay(LocalDate date) {
        return date.plusDays(1).atStartOfDay(ZONE).toInstant();
    }

    public static Instant previousDayClosure(LocalDate date) {
        return date.minusDays(1).atTime(23, 59).atZone(ZONE).toInstant();
    }

    public static InstantRange dayRange(LocalDate date) {
        LocalDate resolvedDate = resolveDate(date);
        return new InstantRange(startOfDay(resolvedDate), endExclusiveOfDay(resolvedDate));
    }

    public static InstantRange monthRange(YearMonth period) {
        return new InstantRange(
                period.atDay(1).atStartOfDay(ZONE).toInstant(),
                period.plusMonths(1).atDay(1).atStartOfDay(ZONE).toInstant()
        );
    }

    public static LocalDate toOperationalDate(Instant instant) {
        return instant.atZone(ZONE).toLocalDate();
    }

    /**
     * Fecha de la cita de un AGENDADO a partir de la hora elegida por el asesor, relativa al momento
     * de la tipificacion (todo en America/Lima). Si la hora es anterior a la hora en que se tipifica,
     * la cita es para el dia siguiente; si es igual o posterior, es para el mismo dia. La fecha queda
     * congelada en ese instante: no depende de "ahora" al leerla despues.
     */
    public static LocalDate scheduledDateFromTime(Instant tipificadoEn, LocalTime horaProgramada) {
        var momento = tipificadoEn.atZone(ZONE);
        LocalDate dia = momento.toLocalDate();
        return horaProgramada.isBefore(momento.toLocalTime()) ? dia.plusDays(1) : dia;
    }

    public record InstantRange(Instant inicio, Instant fin) {
    }
}
