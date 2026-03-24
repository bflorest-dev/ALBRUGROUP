package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.Etapa;
import pe.albrugroup.recruitment_service.entity.enums.Accion;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Evento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long idPostulacion;
    private Long idEmpleadoResponsable;

    private Etapa etapa;
    private Accion accion;

    private String tipificacion;
    private  String subtipificacion;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
