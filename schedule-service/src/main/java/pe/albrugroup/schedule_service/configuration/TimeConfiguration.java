package pe.albrugroup.schedule_service.configuration;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.InitializingBean;

import java.time.Clock;

@Configuration
@EnableConfigurationProperties(ScheduleEngineProperties.class)
public class TimeConfiguration {

    @Bean
    Clock operationalClock() {
        return Clock.system(OperationalDateTime.ZONE);
    }

    @Bean
    InitializingBean configureOperationalDateTime(Clock operationalClock) {
        return () -> OperationalDateTime.useClock(operationalClock);
    }
}
