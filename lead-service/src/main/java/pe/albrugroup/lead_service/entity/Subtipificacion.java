package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.Etapa;

@Entity @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"tipificacion_id","codigo"}))
public class Subtipificacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipificacion_id")
    private Tipificacion tipificacion;
    private String codigo;
    private String descripcion;
    private Integer orden;
    @Enumerated(EnumType.STRING)
    private Etapa etapaCambio;

    private Boolean activo;
}
