package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class PlanAdicional {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_plan", nullable = false)
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_adicional", nullable = false)
    private Adicional adicional;

    private Integer cantidadIncluida;
    private Boolean permiteCompraAdicional;
    private Integer cantidadMaximaAdicional;
    private BigDecimal precioUnitarioAdicional;

    private Boolean activo;
}
