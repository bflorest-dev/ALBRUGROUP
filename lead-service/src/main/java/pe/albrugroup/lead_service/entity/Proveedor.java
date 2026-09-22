package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.TipoReglaFacturacion;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Proveedor {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_regla_facturacion")
    private TipoReglaFacturacion tipoReglaFacturacion;

    @ElementCollection
    @CollectionTable(
            name = "proveedor_corte_facturacion",
            joinColumns = @JoinColumn(name = "id_proveedor")
    )
    @Column(name = "dia_corte")
    @Builder.Default
    private Set<Integer> cortesFacturacion = new HashSet<>();

    private Integer mesesPermanencia;

    @Column(nullable = false)
    @Builder.Default
    private Boolean requiereSecSotVenta = false;

    private Boolean activo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
