package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@Table(indexes = {
        @Index(name = "idx_lead_etapa_last_entry_at", columnList = "etapa, lastEntryAt"),
        @Index(name = "idx_lead_prefijo_lead", columnList = "prefijo, lead"),
        @Index(name = "idx_lead_estado", columnList = "estado")
})
@AllArgsConstructor @NoArgsConstructor
public class Lead {


    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // GTR
    private String prefijo; // +51
    private String lead; // 987654321

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    @Enumerated(EnumType.STRING)
    private EstadoSeguimiento estado;

    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campana")
    private Campana campana;

    @Enumerated(EnumType.STRING)
    private Base base;
    // GENERAL
    private Long idTipificacion;
    private String codigoTipificacion;

    private Long idSubtipificacion;
    private String codigoSubtipificacion;

    // ASESOR VENTAS

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "id_datos_preventa")
    private DatosPreventa datosPreventa;
    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "id_direccion")
    private Direccion direccion;

    // Solo en caso de Preventa Valida

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_plan")
    private Plan plan;

    private String nombrePlanSnapshot;
    private String nombreProveedorSnapshot;
    private BigDecimal precioPlanSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_promocion_interna")
    private PromocionComercial promocionInterna;

    private String nombrePromocionInternaSnapshot;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LeadAdicional> adicionales = new HashSet<>();

    private BigDecimal precioAdicionalesSnapshot;
    private BigDecimal precioFinal;

    private Integer diaCorteFacturacion;
    private Integer mesesPermanenciaSnapshot;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    private Instant lastEntryAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
