package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoPostventa;
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
        @Index(name = "idx_lead_estado", columnList = "estado"),
        @Index(name = "idx_lead_id_asesor_preventa_fecha", columnList = "idAsesorPreventa, fechaPreventa"),
        @Index(name = "idx_lead_id_asesor_venta_fecha", columnList = "idAsesorVenta, fechaVenta"),
        @Index(name = "idx_lead_id_asesor_postventa_fecha", columnList = "idAsesorPostventa, fechaPostventa"),
        @Index(name = "idx_lead_id_asesor_cobranza_fecha", columnList = "idAsesorCobranza, fechaCobranza")
})
@AllArgsConstructor @NoArgsConstructor
// Partición por equipo: el filtro se habilita por request con los equipos del usuario
// (ver EquipoFilterInterceptor). Usuarios con visibilidad global NO lo habilitan (ven todo).
@FilterDef(name = "equipoFilter", parameters = @ParamDef(name = "equipos", type = Long.class))
@Filter(name = "equipoFilter", condition = "id_equipo in (:equipos)")
public class Lead {


    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // GTR
    private String prefijo; // +51
    private String lead; // 987654321

    // Identidad del contacto (teléfono). prefijo+lead se mantienen denormalizados aquí.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_contacto")
    private Contacto contacto;

    // Equipo (partición de datos). Referencia lógica al Equipo administrado en auth-service.
    private Long idEquipo;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    @Enumerated(EnumType.STRING)
    private EstadoSeguimiento estado;

    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;

    // Atención GTR de un lead que ya NO está en PREVENTA: cuando el contacto vuelve a
    // comunicarse y su único lead está en otra etapa, el GTR lo registra y este flag lo
    // hace visible en la bandeja diaria solo para asignarlo a un asesor que atienda la
    // comunicación, sin alterar la gestión del lead en su etapa actual.
    @Builder.Default
    private boolean requiereAtencionGtr = false;

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

    private String primeraCodigoTipificacion;
    private String primeraCodigoSubtipificacion;

    private String numeroDocumentoTitularServicioSnapshot;
    private String direccionSnapshot;

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
    @Enumerated(EnumType.STRING)
    private EstadoPostventa estadoPostventa;

    // ATRIBUCION POR ETAPA
    // Asesor que concreto cada etapa (y cuando). Se sobrescribe cada vez que otro asesor vuelve a
    // concretar la misma etapa sobre el lead (los leads pueden regresar y reiniciar el proceso).
    private Long idAsesorPreventa;
    private Instant fechaPreventa;
    private Long idAsesorVenta;
    private Instant fechaVenta;
    private Long idAsesorPostventa;
    private Instant fechaPostventa;
    private Long idAsesorCobranza;
    private Instant fechaCobranza;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    private Instant lastEntryAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
