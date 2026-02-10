package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

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
    @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;
    @OneToMany(mappedBy = "contrato", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Pago> pagos = new ArrayList<>();
    // PUESTO DE TRABAJO
    @Enumerated(EnumType.STRING)
    @Column(name = "puesto_trabajo")
    private PuestoTrabajo puestoTrabajo;
    @Enumerated(EnumType.STRING)
    private Regimen regimen;
    @Enumerated(EnumType.STRING)
    private Modalidad modalidad;
    @Enumerated(EnumType.STRING)
    @Column(name = "seguro_salud")
    private SeguroSalud seguroSalud;
    @Enumerated(EnumType.STRING)
    @Column(name = "sistema_pensiones")
    private SistemaPensiones sistemaPensiones;
    @Column(name = "sueldo_base", precision = 6, scale = 2)
    private BigDecimal sueldoBase;
    // VIGENCIA
    @Column(name = "fecha_contratacion")
    private LocalDate fechaInicio;
    @Column(name = "fecha_fin_contrato")
    private LocalDate fechaFin;
}
