package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Asociación equipo ↔ proveedor. El equipo (idEquipo) es una referencia lógica al
 * Equipo administrado en auth-service (no hay FK entre servicios); el proveedor sí es
 * local. Define qué proveedores —y por herencia, qué campañas/planes/promos— ve cada equipo.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "equipo_proveedor",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_equipo", "id_proveedor"})
)
public class EquipoProveedor {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_equipo", nullable = false)
    private Long idEquipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;
}
