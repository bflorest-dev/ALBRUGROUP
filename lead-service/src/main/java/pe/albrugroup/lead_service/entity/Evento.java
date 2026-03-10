package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Evento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idLead;

    private Long idActor;

    private Long idReceptor;
    @Enumerated(EnumType.STRING)
    private Accion accion;
    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    private String tipificacion;
    private String subtipificacion;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
