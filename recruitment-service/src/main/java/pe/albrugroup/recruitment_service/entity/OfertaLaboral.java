package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = { @UniqueConstraint(name = "uk_oferta_laboral_codigo", columnNames = "codigo") })
public class OfertaLaboral {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String codigo;
    private Long idSolicitante; // Solo se considera idEmpleado, que sale del token en automatico

    @Enumerated(EnumType.STRING)
    private Negocio negocio;
    @Enumerated(EnumType.STRING)
    private PuestoObjetivo puestoObjetivo;
    @Enumerated(EnumType.STRING)
    private Modalidad modalidad;
    @Enumerated(EnumType.STRING)
    private TurnoHorario horario;
    private Integer cantidadInicial;
    private LocalDate plazoInicial;

    @Enumerated(EnumType.STRING)
    private EstadoOferta estado;

    @OneToMany(mappedBy = "ofertaLaboral", fetch = FetchType.LAZY)
    @Builder.Default
    private List<OfertaAmpliacion> ampliaciones = new ArrayList<>();

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}

// Entidad para controlar cuantos postulantes ingresaron para este requerimiento de personal
// Objetivos adiciones: Controlar si se cumplio con el objetivo de contratar a los postulantes y convertirlos en empleados -> Empl
// Para saber si los empleados se mantuvieron 3 meses en el puesto, y para calcular las comisiones
