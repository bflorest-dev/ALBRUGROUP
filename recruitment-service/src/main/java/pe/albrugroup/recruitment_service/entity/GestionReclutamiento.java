package pe.albrugroup.recruitment_service.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Getter @Setter @NoArgsConstructor
public class GestionReclutamiento {
 @Id private Long postulacionId;
 private long revision;
 private LocalDateTime evaluadaAt;
 private LocalDateTime ultimaGestionAt;
 @Column(length=80) private String ultimoResultado;
}
