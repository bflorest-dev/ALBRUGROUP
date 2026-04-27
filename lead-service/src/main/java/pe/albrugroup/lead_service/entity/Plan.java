package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Plan {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    private String nombre;
    private BigDecimal precio;
    private BigDecimal precioPromocional;
    private Integer mesesPromocionPrecio;

    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_internet")
    private Internet internet;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_television")
    private Television television;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_telefono")
    private Telefono telefono;
    private Integer velocidadPromocional;
    private Integer mesesPromocionVelocidad;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona")
    private Zona zona;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<PlanAdicional> adicionales = new HashSet<>();

    private Boolean activo;
}
