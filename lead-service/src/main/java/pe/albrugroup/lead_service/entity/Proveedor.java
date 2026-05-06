package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Proveedor {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;

    @ElementCollection
    @CollectionTable(
            name = "proveedor_corte_facturacion",
            joinColumns = @JoinColumn(name = "id_proveedor")
    )
    @Column(name = "dia_corte")
    @Builder.Default
    private Set<Integer> cortesFacturacion = new HashSet<>();

    private Integer mesesPermanencia;

    private Boolean activo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
