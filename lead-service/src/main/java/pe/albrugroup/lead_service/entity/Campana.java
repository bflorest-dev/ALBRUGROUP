package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Campana {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    @Column(name = "numero_empresa")
    private String numeroEmpresa;
    @Column(name = "cuenta_publicitaria")
    private String cuentaPublicitaria;
    @Column(name = "nombre_cuenta_publicitaria")
    private String nombreCuentaPublicitaria;
}
