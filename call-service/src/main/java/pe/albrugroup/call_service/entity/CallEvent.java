package pe.albrugroup.call_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import pe.albrugroup.call_service.entity.enums.EventoLlamada;

import java.time.Instant;
import java.util.Map;

/**
 * Log granular de eventos AMI/ARI por llamada.
 * Permite reconstruir el ciclo de vida completo y auditar.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "llamadas_eventos", indexes = {
        @Index(name = "idx_callevent_call", columnList = "id_call, ocurridoEn"),
        @Index(name = "idx_callevent_tipo", columnList = "tipoEvento")
})
public class CallEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_call")
    private Call call;

    @Enumerated(EnumType.STRING)
    private EventoLlamada tipoEvento;

    /** Channel sobre el que ocurrio el evento (ej. PJSIP/1001-00000003). */
    @Column(length = 96)
    private String channel;

    /** Payload completo del evento Asterisk en JSONB. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload;

    private Instant ocurridoEn;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
