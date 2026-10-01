package pe.albrugroup.billing_service.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "matriz_calculo_planilla")
public class MatrizCalculoPlanilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false)
    private boolean activa;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal bonoCapacitacion;

    private String comentario;
    private String creadoPor;

    @Column(updatable = false)
    @CreationTimestamp
    private Instant creadoAt;

    @Builder.Default
    @OneToMany(mappedBy = "matrizCalculo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatrizModalidadPlanilla> modalidades = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "matrizCalculo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MatrizTardanzaPlanilla> tardanzas = new ArrayList<>();
}
