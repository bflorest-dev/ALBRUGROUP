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
    // Momento en que se usó la tipificación INGRESADO de la matriz (registro en el CRM). NO es el
    // ingreso a la etapa VENTA (eso vive en LeadEtapaResumen(VENTA).fechaIngresoEtapa).
    private Instant fechaRegistroCrm;
    private Instant fechaGrabacion;
    private Instant fechaProgramacion;
    private LocalDate fechaRechazo;
    private LocalDate fechaInstalacion;

    // POSTVENTA — fechas automáticas: se sellan (Instant) cuando el cliente pasa a SUSPENDIDO/BAJA
    // desde el flujo de facturación/pagos (no desde la matriz de tipificaciones).
    private Instant fechaSuspension;
    private Instant fechaBaja;

    @UpdateTimestamp 
    private Instant updatedAt;
}
