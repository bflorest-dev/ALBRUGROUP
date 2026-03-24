package pe.albrugroup.recruitment_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.recruitment_service.entity.enums.*;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class Postulacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "postulante_id")
    private Postulante postulante;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "oferta_laboral_id")
    private OfertaLaboral ofertaLaboral;

    private Long idEmpleadoRegistrador;

    @Enumerated(EnumType.STRING)
    private Origen origen;
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
