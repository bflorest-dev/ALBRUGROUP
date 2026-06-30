package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;

/**
 * Configuración por equipo de un campo de captura: si el equipo lo muestra y si es obligatorio.
 * El idEquipo es una referencia lógica al Equipo administrado en auth-service (no hay FK entre
 * servicios), igual que {@link EquipoProveedor}. Solo cubre los campos del catálogo
 * {@link CampoConfigurable}.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "equipo_campo",
        uniqueConstraints = @UniqueConstraint(columnNames = {"id_equipo", "campo"})
)
public class EquipoCampo {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_equipo", nullable = false)
    private Long idEquipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private CampoConfigurable campo;

    @Column(nullable = false)
    @Builder.Default
    private boolean visible = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean requerido = false;
}
