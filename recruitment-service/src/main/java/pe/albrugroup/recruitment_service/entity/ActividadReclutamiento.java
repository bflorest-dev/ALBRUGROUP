package pe.albrugroup.recruitment_service.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import org.hibernate.annotations.CreationTimestamp;

@Entity @Getter @Setter @NoArgsConstructor
public class ActividadReclutamiento {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private Long postulacionId;
 @Column(nullable=false,length=30) private String tipo;
 @Column(nullable=false,length=30) private String modalidad;
 @Column(nullable=false) private LocalDateTime fechaHora;
 @Column(length=500) private String referencia;
 @Column(nullable=false,length=30) private String estado;
 @Column(nullable=false) private Long responsableId;
 @CreationTimestamp @Column(nullable=false,updatable=false) private Instant createdAt;
}
