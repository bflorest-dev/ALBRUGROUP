package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import java.time.Instant;


@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Postulante {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "empleado_id", nullable = false)
    private Empleado empleado;
    // ESTADO
    @Column(name = "etapa_proceso")
    private EtapaProceso etapaProceso;
    @Column(name = "estado_proceso")
    private String estadoProceso;
    @Column(name = "subestado_proceso")
    private String subestadoProceso;
    // OBJETIVO
    @Enumerated(EnumType.STRING)
    private Origen origen;
    @Enumerated(EnumType.STRING) @Column(name = "puesto_objetivo")
    private PuestoTrabajo puestoTrabajo;
    // TRAZABILIDAD
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private Instant fechaCreacion;
    @UpdateTimestamp
    @Column(name = "fecha_actulizacion", updatable = false)
    private Instant fechaActualizacion;
}
