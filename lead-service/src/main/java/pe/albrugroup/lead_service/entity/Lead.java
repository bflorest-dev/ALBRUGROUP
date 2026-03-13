package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class Lead {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // GTR

    private String lead; // +51 987654321

    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    @Enumerated(EnumType.STRING)
    private EstadoSeguimiento estado;

    private Long idAsesorAsignado;
    private String nombreAsesorAsignado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_campana")
    private Campana campana;

    //

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_promocion_interna")
    private PromocionComercial promocionInterna;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_promocion_proveedor")
    private PromocionComercial promocionProveedor;

    @OneToMany(mappedBy = "lead", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<LeadAdicional> adicionales = new HashSet<>();

    private String nombrePromocionInternaSnapshot;
    private String nombrePromocionProveedorSnapshot;

    private BigDecimal precioPlanSnapshot;
    private BigDecimal precioAdicionalesSnapshot;
    private BigDecimal precioFinal;
}
