package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "lead_seguimiento",
        indexes = @Index(name = "idx_lead_seguimiento_lead", columnList = "id_lead")
)
public class LeadSeguimiento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_lead", nullable = false, unique = true)
    private Long idLead;

    // PREVENTA
    private Instant fechaAgendamientoPreventa;

    // VENTA
    private Instant fechaIngresoVenta;
    private Instant fechaGrabacion;
    private Instant fechaProgramacion;
    private LocalDate fechaRechazo;
    private LocalDate fechaInstalacion;

    // POSTVENTA
    private Instant fechaIngresoPostventa;
    private LocalDate fechaSuspension;
    private LocalDate fechaBaja;

    @UpdateTimestamp
    private Instant updatedAt;
}
