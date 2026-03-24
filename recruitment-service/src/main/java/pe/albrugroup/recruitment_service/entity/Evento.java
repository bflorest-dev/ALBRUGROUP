package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.Accion;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.ModalidadContacto;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Evento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulacion_id")
    private Postulacion postulacion;

    private Long idEmpleadoResponsable;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    @Enumerated(EnumType.STRING)
    private Accion accion;
    @Enumerated(EnumType.STRING)
    private ModalidadContacto modalidadContacto;

    private Long idTipificacion;
    private Long idSubtipificacion;
    private String tipificacion;
    private String subtipificacion;
    private String observacion;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
