package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Entity @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"etapa", "id_equipo", "codigo"}))
public class Tipificacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;

    // Equipo dueño de esta matriz (referencia lógica al Equipo de auth-service, sin FK entre servicios,
    // igual que EquipoProveedor.idEquipo). Cada equipo tiene su propia matriz por etapa: la resolución
    // de tipificaciones es siempre por (etapa, idEquipo) y es fail-closed si el equipo no tiene matriz.
    @Column(name = "id_equipo", nullable = false)
    private Long idEquipo;

    private String codigo;
    private String descripcion;
    private Integer orden;

    private Boolean activo;
}
