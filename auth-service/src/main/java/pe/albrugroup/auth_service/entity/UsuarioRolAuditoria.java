package pe.albrugroup.auth_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "usuario_rol_auditoria")
public class UsuarioRolAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "empleado_id", nullable = false)
    private Long empleadoId;

    @Column(name = "actor_empleado_id")
    private Long actorEmpleadoId;

    @Column(name = "actor_username")
    private String actorUsername;

    @Column(name = "rol_principal_anterior")
    private String rolPrincipalAnterior;

    @Column(name = "rol_principal_nuevo", nullable = false)
    private String rolPrincipalNuevo;

    @Column(name = "roles_anteriores", nullable = false, columnDefinition = "TEXT")
    private String rolesAnteriores;

    @Column(name = "roles_nuevos", nullable = false, columnDefinition = "TEXT")
    private String rolesNuevos;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
