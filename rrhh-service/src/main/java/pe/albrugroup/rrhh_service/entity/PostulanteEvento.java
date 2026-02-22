package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.rrhh_service.entity.enums.Evento;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class PostulanteEvento {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne @JoinColumn(name = "postulante_id", nullable = false)
    private Postulante postulante;
    @ManyToOne @JoinColumn(name = "responsable_id", nullable = false)
    private Empleado responsable;
    @Enumerated(EnumType.STRING)
    @Column(name = "etapa_proceso")
    private EtapaProceso etapaProceso;
    @Enumerated(EnumType.STRING)
    private Evento evento;
    private String estado;
    private String subestado;
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private Instant fechaCreacion;

    // CAMPOS SITUACIONALES
    @CreationTimestamp
    @Column(name = "fecha_evento")
    private Instant fechaEvento;
    // Acuerdos Previos
    @Column(name = "inicio_capa")
    private LocalDate inicioCapa;
    @Column(name = "fin_capa")
    private LocalDate finCapa;
    @Column(name = "pago_dia_capa")
    private BigDecimal pagoDiaCapa;
}
