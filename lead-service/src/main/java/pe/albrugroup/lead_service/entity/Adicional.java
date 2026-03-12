package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Adicional {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;
    private BigDecimal precioUnitario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @OneToMany(mappedBy = "adicional")
    @Builder.Default
    private Set<PlanAdicional> planes = new HashSet<>();

    @OneToMany(mappedBy = "adicional")
    @Builder.Default
    private Set<LeadAdicional> leads = new HashSet<>();

    private Boolean activo;
}
