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
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
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

    private String numeroDocumentoTitularServicioSnapshot;
    private String direccionSnapshot;
    @Column(length = 9)
    private String sec;
    @Column(length = 8)
    private String sot;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_plataforma_digital_ofrecida")
    private Plataforma plataformaDigitalOfrecida;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LeadAdicional> adicionales = new HashSet<>();

    private BigDecimal precioAdicionalesSnapshot;
    private BigDecimal precioFinal;

    private Integer diaCorteFacturacion;
    private Integer mesesPermanenciaSnapshot;
    @Enumerated(EnumType.STRING)
    private EstadoClientePostventa estadoClientePostventa;

    // La atribución histórica por etapa (mérito/fechas) y la primera tipificación viven ahora en
    // LeadEtapaResumen (una fila por (idLead, etapa)); el Lead solo conserva su estado operativo vivo.

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    private Instant lastEntryAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
