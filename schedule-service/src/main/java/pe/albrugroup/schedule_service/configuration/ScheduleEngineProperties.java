package pe.albrugroup.schedule_service.configuration;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.LocalDate;

@Getter
@Setter
@ConfigurationProperties(prefix = "schedule.engine")
public class ScheduleEngineProperties {

    private Mode mode = Mode.SHADOW;
    private LocalDate effectiveFrom = LocalDate.of(2026, 6, 15);

    public boolean enabledForNewWrites() {
        return mode == Mode.ADMIN || mode == Mode.ALL;
    }

    public boolean enabledForGtrWrites() {
        return mode == Mode.ALL;
    }

    public boolean enabledForOperationalReads(LocalDate fecha) {
        return mode == Mode.ALL && !fecha.isBefore(effectiveFrom);
    }

    public boolean shadowEnabled(LocalDate fecha) {
        return mode == Mode.SHADOW && !fecha.isBefore(effectiveFrom);
    }

    public enum Mode {
        LEGACY,
        SHADOW,
        ADMIN,
        ALL
    }
}
