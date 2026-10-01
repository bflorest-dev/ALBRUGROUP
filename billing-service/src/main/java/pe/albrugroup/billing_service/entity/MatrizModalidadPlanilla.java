package pe.albrugroup.billing_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.billing_service.entity.enums.ModalidadTrabajo;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "matriz_modalidad_planilla")
public class MatrizModalidadPlanilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_matriz_calculo", nullable = false)
    private MatrizCalculoPlanilla matrizCalculo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ModalidadTrabajo modalidad;

    @Column(nullable = false)
    private Integer horasDia;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal bonoPuntualidad;

    @Column(nullable = false)
    private Integer ventasMinimasProductividad;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal bonoProductividad;
}
