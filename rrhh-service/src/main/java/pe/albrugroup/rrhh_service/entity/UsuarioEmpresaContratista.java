package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "usuario_empresa_contratista",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_empleado", "id_empresa_contratista"}),
        indexes = {
                @Index(name = "idx_uec_empleado", columnList = "id_empleado"),
                @Index(name = "idx_uec_empresa", columnList = "id_empresa_contratista")
        }
)
public class UsuarioEmpresaContratista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_empleado", nullable = false)
    private Long idEmpleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_empresa_contratista", nullable = false)
    private EmpresaContratista empresaContratista;

    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
