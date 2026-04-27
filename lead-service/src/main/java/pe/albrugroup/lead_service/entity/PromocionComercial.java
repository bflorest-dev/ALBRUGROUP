package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class PromocionComercial {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String reglaComercial;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona")
    private Zona zona;

    @ManyToMany
    @JoinTable(
            name = "promocion_comercial_plan",
            joinColumns = @JoinColumn(name = "id_promocion_comercial"),
            inverseJoinColumns = @JoinColumn(name = "id_plan")
    )
    @Builder.Default
    private Set<Plan> planes = new HashSet<>();

    private Boolean activo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
