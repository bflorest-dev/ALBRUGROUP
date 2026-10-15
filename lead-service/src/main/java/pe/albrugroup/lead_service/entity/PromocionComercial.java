package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class PromocionComercial {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String reglaComercial;

    @Enumerated(EnumType.STRING)
    private Etapa etapa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona")
    private Zona zona;

    @ManyToMany
    @JoinTable(
            name = "promocion_comercial_zona",
            joinColumns = @JoinColumn(name = "id_promocion_comercial"),
            inverseJoinColumns = @JoinColumn(name = "id_zona")
    )
    @Builder.Default
    private Set<Zona> zonas = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "promocion_comercial_plan",
            joinColumns = @JoinColumn(name = "id_promocion_comercial"),
            inverseJoinColumns = @JoinColumn(name = "id_plan")
    )
    @Builder.Default
    private Set<Plan> planes = new HashSet<>();

    @OneToMany(mappedBy = "promocionComercial", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PromocionCashbackPeriodo> cashbackPeriodos = new ArrayList<>();

    private Boolean activo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
