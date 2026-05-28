package pe.albrugroup.call_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.call_service.entity.enums.ResultadoIntento;

import java.time.Instant;

/**
 * Un intento de marcacion individual. Varios intentos por (campania, lead/numero).
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "intentos_dialer", indexes = {
        @Index(name = "idx_attempt_campana_estado", columnList = "id_campana, resultado"),
        @Index(name = "idx_attempt_lead", columnList = "id_lead"),
        @Index(name = "idx_attempt_programado", columnList = "programadoPara")
})
public class OutboundAttempt {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campana")
    private OutboundCampaign campaign;

    /** FK logica al Lead (lead-service). En Fase 1 puede ser null si proviene de seed. */
    @Column(name = "id_lead")
    private Long idLead;

    @Column(length = 8)
    private String prefijo;
    @Column(length = 32)
    private String numero;

    private Integer intento;
    private Instant programadoPara;
    private Instant ejecutadoEn;

    @Enumerated(EnumType.STRING)
    private ResultadoIntento resultado;

    /** Si se materializo en una llamada, referencia a Call. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_call")
    private Call call;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
