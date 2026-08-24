package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

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
    private Long idPlanOfrecido;
    @Enumerated(EnumType.STRING)
    private Accion accion;
    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    private String tipificacion;
    private String subtipificacion;
    private LocalDate fechaInstalacion;
    private LocalDate fechaProgramacion;
    private LocalDate fechaRechazo;
    private String comentario;
    private LocalTime horaProgramada;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    void assignCreatedAt() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
