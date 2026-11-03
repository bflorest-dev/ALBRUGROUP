package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Asignación operativa exclusiva de una campaña a un equipo.
 * El equipo es una referencia lógica a auth-service; la campaña sí pertenece a este servicio.
 */
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "equipo_campana", uniqueConstraints = @UniqueConstraint(columnNames = "id_campana"))
public class EquipoCampana {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_equipo", nullable = false)
    private Long idEquipo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campana", nullable = false, unique = true)
    private Campana campana;
}
