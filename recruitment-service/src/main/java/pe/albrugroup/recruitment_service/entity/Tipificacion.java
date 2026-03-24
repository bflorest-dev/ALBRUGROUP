package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"etapa", "codigo"}))
public class Tipificacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    private String codigo;
    private String descripcion;
    private Integer orden;
    private Boolean activo;
}
