package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Entity @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"matriz_id", "codigo"}))
public class Tipificacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "matriz_id", nullable = false)
    private MatrizTipificacion matriz;

    @Column(name = "id_equipo", insertable = false, updatable = false)
    private Long idEquipo;

    private String codigo;
    private String descripcion;
    private Integer orden;

    @Column(nullable = false)
    private Boolean seleccionableManual = Boolean.TRUE;

    private Boolean activo;

    public Etapa getEtapa() {
        return matriz == null ? null : matriz.getEtapa();
    }
}
