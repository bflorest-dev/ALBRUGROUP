package pe.albrugroup.call_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.call_service.entity.enums.AmdResult;
import pe.albrugroup.call_service.entity.enums.CallDirection;
import pe.albrugroup.call_service.entity.enums.CallStatus;
import pe.albrugroup.call_service.entity.enums.HangupBy;

import java.time.Instant;

/**
 * Una fila por llamada (nucleo de KPIs).
 * Idempotente vs Asterisk via uniqueId.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "llamadas", indexes = {
        @Index(name = "idx_call_unique_id", columnList = "uniqueId", unique = true),
        @Index(name = "idx_call_linked_id", columnList = "linkedId"),
        @Index(name = "idx_call_asesor_answered", columnList = "id_asesor_asignado, answeredAt"),
        @Index(name = "idx_call_campana_ended", columnList = "id_campana, endedAt"),
        @Index(name = "idx_call_estado", columnList = "estado")
})
public class Call {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Channel UniqueID asignado por Asterisk (idempotencia). */
    @Column(unique = true, length = 64)
    private String uniqueId;

    /** Agrupa transferencias y consultivas (Asterisk linkedid). */
    @Column(length = 64)
    private String linkedId;

    @Enumerated(EnumType.STRING)
    private CallDirection direction;

    @Enumerated(EnumType.STRING)
    private CallStatus estado;

    /** Causa SIP / Q.850 del hangup (ej. "16 - Normal Clearing"). */
    private String hangupCause;

    /**
     * Quien inicio el hangup (AGENT / CLIENT / SYSTEM / UNKNOWN). Se decide al recibir
     * el PRIMER HangupEvent de la llamada (los siguientes no lo sobreescriben).
     * Base para reportes de auditoria del operativo.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private HangupBy hangupBy;

    /**
     * Resultado de Answering Machine Detection. Se llena cuando el dialplan ejecuta
     * AMD() (Fase 2). En Fase 1 todas las llamadas quedan con NOT_RUN.
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    @Builder.Default
    private AmdResult amdResult = AmdResult.NOT_RUN;

    /** Detalle tecnico devuelto por AMD (AMDCAUSE). Util para tunear el algoritmo. */
    @Column(length = 64)
    private String amdCause;

    // ===== Referencias cross-service (id + snapshot, patron del proyecto) =====

    /** FK logica a OutboundCampaign (cuando es saliente). */
    @Column(name = "id_campana")
    private Long idCampana;
    private String nombreCampanaSnapshot;

    /** FK logica al Lead (lead-service). */
    @Column(name = "id_lead")
    private Long idLead;

    /** Numero del cliente (espejo del campo "lead" de la entidad Lead). */
    @Column(length = 8)
    private String prefijoCliente;
    @Column(length = 32)
    private String numeroCliente;

    /** FK logica al Empleado/Usuario que tomo la llamada. */
    @Column(name = "id_asesor_asignado")
    private Long idAsesorAsignado;
    private String nombreAsesorSnapshot;

    /** Extension SIP del asesor (ej. "PJSIP/1001"). */
    @Column(length = 32)
    private String extensionAsesor;

    /** Nombre de la cola de Asterisk por la que paso. */
    @Column(length = 64)
    private String queueName;

    // ===== Timestamps clave (alimentan TMO, ASA, etc.) =====

    /** OUTBOUND: cuando call-service pidio Originate. INBOUND: ringStart en cola. */
    private Instant originatedAt;
    private Instant ringStartAt;
    /** Cuando el destino contesto. */
    private Instant answeredAt;
    /** Cuando cliente y asesor quedaron unidos en bridge. */
    private Instant bridgedAt;
    private Instant agentTalkStartAt;
    private Instant endedAt;

    // ===== KPIs derivados precalculados =====

    /** ringStart -> answered (ASA en inbound). */
    private Integer waitSeconds;
    /** bridged -> ended. */
    private Integer talkSeconds;
    /** Tiempo en hold acumulado. */
    private Integer holdSeconds;
    /** Tipificacion post-llamada. */
    private Integer wrapUpSeconds;
    /** talk + hold + wrapUp (Tiempo Medio Operativo). */
    private Integer tmoSeconds;

    // ===== Resultado de negocio (snapshot) =====

    @Column(length = 32)
    private String codigoTipificacion;
    @Column(length = 32)
    private String codigoSubtipificacion;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
