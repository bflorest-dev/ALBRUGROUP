package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.EstadoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.PrioridadEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.StatusEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoContactoEncuesta;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_encuesta_postventa_lead_created_at", columnList = "id_lead, createdAt"),
        @Index(name = "idx_encuesta_postventa_periodo_estado", columnList = "id_periodo_facturacion, estado"),
        @Index(name = "idx_encuesta_postventa_programada", columnList = "fechaProgramada")
})
public class EncuestaPostventa {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_lead", nullable = false)
    private Lead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_periodo_facturacion")
    private PeriodoFacturacionPostventa periodoFacturacionPostventa;

    @Enumerated(EnumType.STRING)
    private TipoEncuestaPostventa tipoEncuesta;

    @Enumerated(EnumType.STRING)
    private TipoContactoEncuesta tipoContacto;

    private Integer calificacion;

    @Enumerated(EnumType.STRING)
    private StatusEncuestaPostventa status;

    @Enumerated(EnumType.STRING)
    private EstadoEncuestaPostventa estado;

    @Enumerated(EnumType.STRING)
    private PrioridadEncuestaPostventa prioridad;

    private LocalDateTime fechaProgramada;
    private LocalDateTime fechaLimite;
    private LocalDateTime fechaRealizada;
    private Integer numeroEncuesta;
    private String comentario;
    private Long idAsesorEncuesta;
    private String nombreAsesorEncuesta;

    @CreationTimestamp
    @jakarta.persistence.Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
