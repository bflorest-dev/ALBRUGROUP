package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.enums.Modalidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Contrato {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // RELACION
    @ManyToOne
    @JoinColumn(name = "empleado_id")
    private Empleado empleado;
    @OneToMany(mappedBy = "contrato", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Pago> pagos = new ArrayList<>();
    // PUESTO DE TRABAJO
    @Enumerated(EnumType.STRING)
    @Column(name = "puesto_trabajo")
    private PuestoTrabajo puestoTrabajo;
    @Enumerated(EnumType.STRING)
    private Modalidad modalidad;
    @Column(precision = 10, scale = 2)
    private BigDecimal sueldoBase;
    // VIGENCIA
    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;
    @Column(name = "fecha_fin")
    private LocalDate fechaFin;
}
