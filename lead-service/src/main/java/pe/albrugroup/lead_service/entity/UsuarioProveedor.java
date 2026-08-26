package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;

import java.time.Instant;

/**
 * Asignación empleado→proveedor para roles acotados por proveedor (BACKOFFICE / POSTVENTA).
 * Reemplaza a PostventaAsesorProveedor: el ámbito distingue qué bandeja acota. Un empleado
 * puede tener varios proveedores en un mismo ámbito; el selector del frontend evita mezclar
 * bandejas eligiendo un proveedor activo (header X-Proveedor-Id).
 */
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(
        name = "usuario_proveedor",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_empleado", "id_proveedor", "ambito"}),
        indexes = {
                @Index(name = "idx_usuario_proveedor_empleado_ambito", columnList = "id_empleado, ambito"),
                @Index(name = "idx_usuario_proveedor_proveedor", columnList = "id_proveedor")
        }
)
public class UsuarioProveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_empleado", nullable = false)
    private Long idEmpleado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AmbitoProveedor ambito;

    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
