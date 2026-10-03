package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "resumen_financiero_dia_zona", uniqueConstraints = @UniqueConstraint(columnNames = {"id_resumen_dia", "id_zona"}))
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class ResumenFinancieroDiaZona {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_resumen_dia", nullable = false)
    private ResumenFinancieroDia resumenDia;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_zona", nullable = false)
    private Zona zona;

    @Column(nullable = false)
    @Builder.Default
    private int ingresadas = 0;

    @Column(nullable = false)
    @Builder.Default
    private int instaladas = 0;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal cfInstaladas = BigDecimal.ZERO;
}
