package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
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
import pe.albrugroup.lead_service.entity.enums.EstadoEntregaCredencial;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_entrega_credencial_lead_estado", columnList = "id_lead, estado"),
        @Index(name = "idx_entrega_credencial_credencial_estado", columnList = "id_credencial, estado")
})
public class EntregaCredencialPlataforma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_credencial", nullable = false)
    private CredencialPlataforma credencial;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_lead", nullable = false)
    private Lead lead;

    private Integer cantidadUsuariosAsignados;

    @Builder.Default
    private Boolean esObsequio = true;

    private BigDecimal montoVenta;
    private LocalDate fechaEntrega;
    private LocalDate fechaInicioAcceso;
    private LocalDate fechaFinAcceso;

    @Enumerated(EnumType.STRING)
    private EstadoEntregaCredencial estado;

    private Long idAsesorEntrega;
    private String nombreAsesorEntrega;
    private String observacion;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
