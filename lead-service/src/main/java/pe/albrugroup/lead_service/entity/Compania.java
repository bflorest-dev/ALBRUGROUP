package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Compania {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String razonSocial;
    @Column(length = 11)
    private String ruc;
    private String negocio;
}
