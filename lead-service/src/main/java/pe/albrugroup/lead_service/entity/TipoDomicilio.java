package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tipo_domicilio")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class TipoDomicilio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false)
    private boolean esVertical;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    @Column(nullable = false)
    private boolean activo;
}
