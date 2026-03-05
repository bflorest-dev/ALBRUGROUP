package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Campana {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String numeroWhatsappEmpresa;
    private Boolean activo;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_cuenta_publicitaria", nullable = false)
    private CuentaPublicitaria cuentaPublicitaria;
}
