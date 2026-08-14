package pe.albrugroup.schedule_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Snapshot de cierre mensual (inmutable), creado al cerrar el mes / primer acceso a un mes pasado
 * (materializacion perezosa). El mes en curso se deriva en vivo y NO tiene fila. Guarda HECHOS
 * balanceados (sin dinero); el ms de calculo aplica tarifas/descuentos sobre esto.
 * minutosExtra / minutosCompensados en minutos exactos.
 */
@Entity @Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@Table(
        name = "resumen_asistencia_mensual",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_resumen_mensual",
                columnNames = {"idEmpleado", "anio", "mes"})
)
public class ResumenAsistenciaMensual {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long idEmpleado;
    @Column(nullable = false)
    private Integer anio;
    @Column(nullable = false)
    private Integer mes;

    private Instant fechaCierre;
    private Long cerradoPor;

    private Integer diasLaborables;
    private Integer diasPresente;
    private Integer diasTardanza;
    /** Sub-conteo de diasTardanza con corrimiento COMPENSABLE (SUP/ADMIN, tardanza no notificada). */
    private Integer diasTardanzaCompensable;
    /** Sub-conteo de diasTardanza con corrimiento JUSTIFICADA (RRHH). */
    private Integer diasTardanzaJustificada;
    private Integer diasFalta;
    private Integer minutosObjetivo;
    private Integer minutosTrabajados;
    private Integer balanceFinal;
    private Integer minutosExtra;
    private Integer minutosCompensados;
    private Integer cantidadTardanzas;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
