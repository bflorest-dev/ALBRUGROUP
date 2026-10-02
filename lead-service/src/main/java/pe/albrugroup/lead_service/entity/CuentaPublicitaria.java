package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class CuentaPublicitaria {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String numeroCuenta;
    private String nombreCuenta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    private Boolean activo;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
