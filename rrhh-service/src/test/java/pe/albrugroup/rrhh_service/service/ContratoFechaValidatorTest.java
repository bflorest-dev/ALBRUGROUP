package pe.albrugroup.rrhh_service.service;

import org.junit.jupiter.api.Test;
import pe.albrugroup.rrhh_service.exception.BadRequestException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ContratoFechaValidatorTest {

    private static final LocalDate INICIO = LocalDate.of(2026, 9, 1);
    private static final LocalDate HOY = LocalDate.of(2026, 10, 1);

    @Test
    void permiteCerrarElMismoDiaDeInicio() {
        ContratoFechaValidator.validarFechaCierre(INICIO, INICIO, HOY);
    }

    @Test
    void permiteCerrarAntesDeHoySiNoEsAnteriorAlInicio() {
        ContratoFechaValidator.validarFechaCierre(INICIO, LocalDate.of(2026, 9, 15), HOY);
    }

    @Test
    void rechazaFechaAnteriorAlInicio() {
        assertThatThrownBy(() -> ContratoFechaValidator.validarFechaCierre(
                INICIO, INICIO.minusDays(1), HOY))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fecha de fin");
    }

    @Test
    void rechazaFechaPosteriorAHoy() {
        assertThatThrownBy(() -> ContratoFechaValidator.validarFechaCierre(
                INICIO, HOY.plusDays(1), HOY))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("posterior a hoy");
    }
}
