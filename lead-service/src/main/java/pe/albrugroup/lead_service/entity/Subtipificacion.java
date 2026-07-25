package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"tipificacion_id","codigo"}))
public class Subtipificacion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipificacion_id")
    private Tipificacion tipificacion;
    private String codigo;
    private String descripcion;
    private Integer orden;
    @Enumerated(EnumType.STRING)
    private Etapa etapaCambio;

    // Comportamientos que dispara esta subtipi (data-driven; reemplaza los códigos hardcodeados). Ausencia
    // de un valor = false. @BatchSize evita el N+1 al cargar el catálogo (lista de subtipis).
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
            name = "subtipificacion_comportamiento",
            joinColumns = @JoinColumn(name = "subtipificacion_id")
    )
    @Column(name = "comportamiento")
    @Enumerated(EnumType.STRING)
    @BatchSize(size = 200)
    private Set<ComportamientoTipificacion> comportamientos = new HashSet<>();

    private Boolean activo;
}
