package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Postulacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulante_id")
    private Postulante postulante;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "oferta_laboral_id")
    private OfertaLaboral ofertaLaboral;

    private Long idEmpleadoRegistrador;

    @Enumerated(EnumType.STRING)
    private Origen origen;
    @Enumerated(EnumType.STRING)
    private PuestoObjetivo puestoObjetivo;
    @Enumerated(EnumType.STRING)
    private Negocio negocio;
    @Enumerated(EnumType.STRING)
    private Modalidad modalidad;
    @Enumerated(EnumType.STRING)
    private TurnoHorario horario;
    private LocalDate fechaPostulacion;
    @Enumerated(EnumType.STRING)
    private Etapa etapa;
    @Enumerated(EnumType.STRING)
    private EstadoPostulacion estado;
    @Enumerated(EnumType.STRING)
    private EstadoBandejaPostulacion estadoBandeja;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;
}
