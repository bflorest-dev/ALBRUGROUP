package pe.albrugroup.schedule_service.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers(disabledWithoutDocker = true)
class FlywayJornadaEngineIntegrationTest {

    @Container
    private static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:17-alpine");

    @BeforeAll
    static void migrate() {
        Flyway.configure()
                .dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
                .load()
                .migrate();
    }

    @Test
    void flywayCreatesAdjustmentAndSegmentColumns() throws SQLException {
        try (Connection connection = connection()) {
            assertThat(columnExists(connection, "ajuste_jornada", "reemplazado_por_id")).isTrue();
            assertThat(columnExists(connection, "asistencia_tramo", "ajuste_jornada_id")).isTrue();
            assertThat(columnExists(connection, "asistencia", "origen_tramo_actual")).isTrue();
        }
    }

    @Test
    void serializesTwoOverlappingAdjustmentsForTheSameEmployeeAndDate() throws Exception {
        long scheduleId = insertSchedule();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = executor.submit(() -> registerAdjustment(
                    start, scheduleId,
                    LocalDateTime.of(2026, 6, 15, 8, 0),
                    LocalDateTime.of(2026, 6, 15, 15, 0),
                    "Primera solicitud"
            ));
            Future<?> second = executor.submit(() -> registerAdjustment(
                    start, scheduleId,
                    LocalDateTime.of(2026, 6, 15, 11, 0),
                    LocalDateTime.of(2026, 6, 15, 18, 0),
                    "Segunda solicitud"
            ));
            start.countDown();
            first.get();
            second.get();
        } finally {
            executor.shutdownNow();
        }

        try (Connection connection = connection();
             PreparedStatement statement = connection.prepareStatement("""
                     SELECT estado, COUNT(*)
                     FROM ajuste_jornada
                     WHERE id_empleado = 21 AND fecha_operativa = DATE '2026-06-15'
                     GROUP BY estado
                     """);
             ResultSet result = statement.executeQuery()) {
            int activos = 0;
            int reemplazados = 0;
            while (result.next()) {
                if ("ACTIVO".equals(result.getString(1))) activos = result.getInt(2);
                if ("REEMPLAZADO".equals(result.getString(1))) reemplazados = result.getInt(2);
            }
            assertThat(activos).isEqualTo(1);
            assertThat(reemplazados).isEqualTo(1);
        }
    }

    private static long insertSchedule() throws SQLException {
        try (Connection connection = connection()) {
            connection.setAutoCommit(false);
            try (Statement statement = connection.createStatement()) {
                statement.executeUpdate("DELETE FROM ajuste_jornada");
                statement.executeUpdate("DELETE FROM horario_detalle");
                statement.executeUpdate("DELETE FROM horario");
                statement.executeUpdate("DELETE FROM politica_modalidad");
                statement.executeUpdate("""
                        INSERT INTO politica_modalidad (
                            modalidad, horas_objetivo_semanal, horas_objetivo_mensual,
                            minutos_almuerzo, minutos_servicios
                        ) VALUES ('FULL_TIME', 48, 192, 60, 20)
                        """);
            }
            long policyId;
            try (Statement statement = connection.createStatement();
                 ResultSet result = statement.executeQuery("SELECT id FROM politica_modalidad")) {
                result.next();
                policyId = result.getLong(1);
            }
            try (PreparedStatement statement = connection.prepareStatement("""
                    INSERT INTO horario (
                        id_empleado, id_contrato, modalidad_contrato, politica_modalidad_id,
                        horas_objetivo_semanal, horas_objetivo_mensual,
                        minutos_almuerzo, minutos_servicios, fecha_inicio, compensable
                    ) VALUES (21, 31, 'FULL_TIME', ?, 48, 192, 60, 20, DATE '2026-06-01', TRUE)
                    RETURNING id
                    """)) {
                statement.setLong(1, policyId);
                try (ResultSet result = statement.executeQuery()) {
                    result.next();
                    long id = result.getLong(1);
                    connection.commit();
                    return id;
                }
            }
        }
    }

    private static void registerAdjustment(
            CountDownLatch start,
            long scheduleId,
            LocalDateTime begin,
            LocalDateTime end,
            String reason
    ) {
        try {
            start.await();
            try (Connection connection = connection()) {
                connection.setAutoCommit(false);
                try (PreparedStatement lock = connection.prepareStatement(
                        "SELECT id FROM horario WHERE id = ? FOR UPDATE")) {
                    lock.setLong(1, scheduleId);
                    lock.executeQuery().close();
                }

                List<Long> overlapping = new ArrayList<>();
                try (PreparedStatement select = connection.prepareStatement("""
                        SELECT id
                        FROM ajuste_jornada
                        WHERE id_empleado = 21
                          AND fecha_operativa = DATE '2026-06-15'
                          AND estado = 'ACTIVO'
                          AND inicio < ?
                          AND ? < fin
                        """)) {
                    select.setTimestamp(1, Timestamp.valueOf(end));
                    select.setTimestamp(2, Timestamp.valueOf(begin));
                    try (ResultSet result = select.executeQuery()) {
                        while (result.next()) overlapping.add(result.getLong(1));
                    }
                }

                long newId;
                try (PreparedStatement insert = connection.prepareStatement("""
                        INSERT INTO ajuste_jornada (
                            id_empleado, horario_id, fecha_operativa, inicio, fin,
                            estado, origen, motivo, creado_por
                        ) VALUES (21, ?, ?, ?, ?, 'ACTIVO', 'REEMPLAZO_BASE', ?, 99)
                        RETURNING id
                        """)) {
                    insert.setLong(1, scheduleId);
                    insert.setObject(2, LocalDate.of(2026, 6, 15));
                    insert.setTimestamp(3, Timestamp.valueOf(begin));
                    insert.setTimestamp(4, Timestamp.valueOf(end));
                    insert.setString(5, reason);
                    try (ResultSet result = insert.executeQuery()) {
                        result.next();
                        newId = result.getLong(1);
                    }
                }

                try (PreparedStatement replace = connection.prepareStatement("""
                        UPDATE ajuste_jornada
                        SET estado = 'REEMPLAZADO', reemplazado_por_id = ?
                        WHERE id = ?
                        """)) {
                    for (Long previousId : overlapping) {
                        replace.setLong(1, newId);
                        replace.setLong(2, previousId);
                        replace.addBatch();
                    }
                    replace.executeBatch();
                }
                connection.commit();
            }
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static boolean columnExists(Connection connection, String table, String column) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement("""
                SELECT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = ? AND column_name = ?
                )
                """)) {
            statement.setString(1, table);
            statement.setString(2, column);
            try (ResultSet result = statement.executeQuery()) {
                result.next();
                return result.getBoolean(1);
            }
        }
    }

    private static Connection connection() throws SQLException {
        return DriverManager.getConnection(
                POSTGRES.getJdbcUrl(),
                POSTGRES.getUsername(),
                POSTGRES.getPassword()
        );
    }
}
