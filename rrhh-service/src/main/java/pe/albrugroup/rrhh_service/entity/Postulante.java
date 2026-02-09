package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.math.BigDecimal;
import java.time.LocalDate;

@Table(
        name = "postulantes",
        indexes = {
                @Index(name = "idx_postulante_estado_inicio", columnList = "estado_postulacion, inicio_capacitacion"),
                @Index(name = "idx_postulante_empleado_estado", columnList = "empleado_id, estado_postulacion")
        }
)
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Postulante {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;

    @Enumerated(EnumType.STRING)
    private Origen origen;
    @Enumerated(EnumType.STRING) @Column(name = "puesto_objetivo")
    private PuestoTrabajo puestoTrabajo;
    @Enumerated(EnumType.STRING) @Column(name = "estado_postulacion")
    private EstadoPostulacion estadoPostulacion;
    @Column(name = "pago_dia_capacitacion", precision = 6, scale = 2)
    private BigDecimal pagoDiaCapacitacion;
    @Column(name = "inicio_capacitacion")
    private LocalDate fechaInicio;
    @Column(name = "fin_capacitacion")
    private LocalDate fechaFin;
}
