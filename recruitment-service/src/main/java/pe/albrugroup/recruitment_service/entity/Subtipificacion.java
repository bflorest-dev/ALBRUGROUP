package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.recruitment_service.entity.enums.AlcanceSubtipificacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoBandejaPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"tipificacion_id", "codigo"}))
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
    private AlcanceSubtipificacion alcance;
    @Enumerated(EnumType.STRING)
    private Etapa etapaDestino;
    @Enumerated(EnumType.STRING)
    private EstadoPostulacion estadoDestino;
    @Enumerated(EnumType.STRING)
    private EstadoBandejaPostulacion estadoBandejaDestino;
    private Boolean activo;
}
