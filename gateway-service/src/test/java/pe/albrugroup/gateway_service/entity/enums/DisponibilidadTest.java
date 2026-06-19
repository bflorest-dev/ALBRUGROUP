package pe.albrugroup.gateway_service.entity.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DisponibilidadTest {

    @Test
    void admiteEstadosDeCargaPendiente() {
        assertThat(Disponibilidad.valueOf("CON_LEADS")).isEqualTo(Disponibilidad.CON_LEADS);
        assertThat(Disponibilidad.valueOf("SIN_GESTIONAR")).isEqualTo(Disponibilidad.SIN_GESTIONAR);
    }
}
