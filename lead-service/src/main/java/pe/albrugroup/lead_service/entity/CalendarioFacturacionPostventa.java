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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.BloqueFacturacion;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_calendario_postventa_lead", columnList = "id_lead"),
        @Index(name = "idx_calendario_postventa_instalacion", columnList = "fechaInstalacion")
})
public class CalendarioFacturacionPostventa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_lead", nullable = false)
    private Lead lead;

    private LocalDate fechaInstalacion;
    private String proveedorSnapshot;
    private String planSnapshot;
    private Integer mesesPermanenciaSnapshot;
    private BigDecimal montoPlanSnapshot;

    @Enumerated(EnumType.STRING)
    private TipoReglaFacturacion tipoReglaProveedor;

    private Integer diaCorte;
    private Integer diaEmisionEstimado;
    private Integer diaVencimiento;
    private LocalDate mesCorteBase;
    private Integer numeroCorteBase;

    @Enumerated(EnumType.STRING)
    private BloqueFacturacion bloqueFacturacion;

    @Builder.Default
    private Boolean requiereProrrateoInicial = false;

    @Builder.Default
    private Boolean activo = true;

    @Builder.Default
    private Boolean corteCorregido = false;

    private Instant fechaCorreccionCorte;

    private String observacion;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
