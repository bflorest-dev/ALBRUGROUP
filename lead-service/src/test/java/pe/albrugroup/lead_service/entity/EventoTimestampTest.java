package pe.albrugroup.lead_service.entity;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class EventoTimestampTest {

    @Test
    void asignaElInstanteActualSoloCuandoNoSeProporcionoUno() {
        Evento normal = Evento.builder().build();
        Instant before = Instant.now();
        normal.assignCreatedAt();
        Instant after = Instant.now();

        Instant explicit = Instant.parse("2026-01-01T00:00:00Z");
        Evento retroactive = Evento.builder().createdAt(explicit).build();
        retroactive.assignCreatedAt();

        assertThat(normal.getCreatedAt()).isBetween(before, after);
        assertThat(retroactive.getCreatedAt()).isEqualTo(explicit);
    }
}
