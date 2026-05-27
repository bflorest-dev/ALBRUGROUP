package pe.albrugroup.schedule_service.configuration;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
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

    public static LocalDateTime nowLocalDateTime() {
        return LocalDateTime.now(ZONE);
    }

    public static LocalDate today() {
        return LocalDate.now(ZONE);
    }

    public static LocalTime currentTime() {
        return LocalTime.now(ZONE);
    }

    public static YearMonth currentMonth() {
        return YearMonth.now(ZONE);
    }

    public static LocalDate resolveDate(LocalDate date) {
        return date == null ? today() : date;
    }
}
