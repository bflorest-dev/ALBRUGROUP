package pe.albrugroup.lead_service.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void explicaCuandoElHistorialDeEtapaYaExiste() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "duplicate key",
                new ConstraintViolationException(
                        "duplicate key",
                        new SQLException("duplicate key value violates unique constraint \"uk_lead_etapa\""),
                        "uk_lead_etapa"
                )
        );

        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrityViolation(exception);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("DATA_INTEGRITY_VIOLATION", response.getBody().get("code"));
        assertEquals("uk_lead_etapa", response.getBody().get("constraint"));
        assertTrue(((List<?>) response.getBody().get("details")).getFirst().toString().contains("historial"));
    }

    @Test
    void extraeTablaYColumnaCuandoLaBaseNoDevuelveNombreDeRestriccion() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException(
                "null value",
                new SQLException("null value in column \"id_origen\" of relation \"lead\" violates not-null constraint")
        );

        ResponseEntity<Map<String, Object>> response = handler.handleDataIntegrityViolation(exception);

        assertEquals("lead", response.getBody().get("table"));
        assertEquals("id_origen", response.getBody().get("column"));
        assertTrue(((List<?>) response.getBody().get("details")).getFirst().toString().contains("id_origen"));
    }
}
