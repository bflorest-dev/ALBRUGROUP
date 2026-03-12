package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.TipoVenta;

import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class PromocionComercial {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nombre;

    private Boolean interno;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_zona")
    private Zona zona;

    // A revisar donde va este campo
//    @Enumerated(EnumType.STRING)
//    private TipoVenta tipoVenta;

    private Boolean descuento;
    private Integer cantidadMeses;

    private LocalDate vigenciaDesde;
    private LocalDate vigenciaHasta;

    private Boolean activo;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
