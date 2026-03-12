package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Internet {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Integer velocidad;
    @Enumerated(EnumType.STRING)
    private Unidad unidad;
    @Enumerated(EnumType.STRING)
    private Tecnologia tecnologia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    private Boolean activo;
}
