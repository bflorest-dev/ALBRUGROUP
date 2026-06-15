package pe.albrugroup.schedule_service.configuration;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.Clock;

public final class OperationalDateTime {

    public static final ZoneId ZONE = ZoneId.of("America/Lima");
    private static volatile Clock clock = Clock.system(ZONE);

    private OperationalDateTime() {
    }

    public static Instant now() {
        return Instant.now(clock);
    }

    public static LocalDateTime nowLocalDateTime() {
        return LocalDateTime.now(clock);
    }

    public static LocalDate today() {
        return LocalDate.now(clock);
    }

    public static LocalTime currentTime() {
        return LocalTime.now(clock);
    }

    public static YearMonth currentMonth() {
        return YearMonth.now(clock);
    }

    public static LocalDate resolveDate(LocalDate date) {
        return date == null ? today() : date;
    }

    public static void useClock(Clock operationalClock) {
        clock = operationalClock;
    }
}
