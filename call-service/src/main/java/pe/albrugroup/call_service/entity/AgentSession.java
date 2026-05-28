package pe.albrugroup.call_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.call_service.entity.enums.EstadoAgente;

import java.time.Instant;

/**
 * Ventana de sesion de un asesor logueado al sistema de telefonia.
 * Cruzando con Call permite calcular ocupacion, adherencia y disponibilidad.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "sesiones_agente", indexes = {
        @Index(name = "idx_agentsession_empleado_login", columnList = "id_empleado, loginAt"),
        @Index(name = "idx_agentsession_extension_activa", columnList = "extension, logoutAt"),
        @Index(name = "idx_agentsession_estado", columnList = "estadoActual")
})
public class AgentSession {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK logica al Empleado de rrhh-service. */
    @Column(name = "id_empleado")
    private Long idEmpleado;
    private String nombreEmpleadoSnapshot;

    /** Extension SIP asignada (ej. "1001"). */
    @Column(length = 32)
    private String extension;

    private Instant loginAt;
    /** Null mientras la sesion sigue activa. */
    private Instant logoutAt;

    @Enumerated(EnumType.STRING)
    private EstadoAgente estadoActual;

    private Instant ultimaTransicionEn;

    /** Acumulados de la sesion (segundos). */
    private Long tiempoTotalDisponible;
    private Long tiempoTotalEnLlamada;
    private Long tiempoTotalWrapUp;
    private Long tiempoTotalBreak;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
