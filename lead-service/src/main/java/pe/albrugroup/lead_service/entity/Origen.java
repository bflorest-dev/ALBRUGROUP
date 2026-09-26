package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Origen {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String codigo;
    @Column(nullable = false, length = 60)
    private String nombre;
    @Column(nullable = false)
    @Builder.Default
    private boolean esOrganico = true;
    @Column(nullable = false)
    @Builder.Default
    private boolean esCampana = false;
    @Column(nullable = false)
    @Builder.Default
    private boolean activo = true;
    @Column(nullable = false)
    @Builder.Default
    private int orden = 0;
}
