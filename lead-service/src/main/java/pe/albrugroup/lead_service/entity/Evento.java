package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@Table(indexes = {
        @Index(name = "idx_evento_id_lead_created_at", columnList = "idLead, createdAt"),
        @Index(name = "idx_evento_id_actor_created_at", columnList = "idActor, createdAt"),
        @Index(name = "idx_evento_id_lead_accion_created_at", columnList = "idLead, accion, createdAt")
})
@AllArgsConstructor @NoArgsConstructor
public class Evento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idLead;
    private Long idCampana;

    private Long idActor;
    private String nombreActor;
    private String rolActor;
    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;
    @Enumerated(EnumType.STRING)
    private Accion accion;
    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    private String tipificacion;
    private String subtipificacion;
    private LocalDate fechaInstalacion;
    private String comentario;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
