package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.ModoSubsanacion;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
        name = "subsanacion_auditoria",
        uniqueConstraints = @UniqueConstraint(name = "uk_subsanacion_request_id", columnNames = "request_id"),
        indexes = @Index(name = "idx_subsanacion_auditoria_lead", columnList = "id_lead")
)
public class SubsanacionAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false, updatable = false)
    private UUID requestId;

    @Column(name = "id_lead", nullable = false, updatable = false)
    private Long idLead;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false)
    private ModoSubsanacion modo;

    @Column(name = "id_admin", nullable = false, updatable = false)
    private Long idAdmin;

    @Column(name = "nombre_admin", nullable = false, updatable = false)
    private String nombreAdmin;

    @Column(name = "rol_admin", nullable = false, updatable = false)
    private String rolAdmin;

    @Column(name = "fecha_gestion", nullable = false, updatable = false)
    private LocalDate fechaGestion;

    @Column(name = "fecha_instalacion", nullable = false, updatable = false)
    private LocalDate fechaInstalacion;

    @Column(nullable = false, length = 1000, updatable = false)
    private String motivo;

    @Column(name = "snapshot_anterior", columnDefinition = "TEXT", updatable = false)
    private String snapshotAnterior;

    @Column(name = "snapshot_resultado", columnDefinition = "TEXT")
    private String snapshotResultado;

    @Column(name = "eventos_reemplazados", nullable = false)
    private Integer eventosReemplazados;

    @Column(name = "resumenes_reemplazados", nullable = false)
    private Integer resumenesReemplazados;

    @Column(name = "artefactos_postventa_reemplazados", nullable = false)
    private Integer artefactosPostventaReemplazados;

    @Column(name = "oportunidades_hermanas_afectadas", nullable = false)
    private Integer oportunidadesHermanasAfectadas;

    @CreationTimestamp
    @Column(name = "ejecutado_at", nullable = false, updatable = false)
    private Instant ejecutadoAt;
}
