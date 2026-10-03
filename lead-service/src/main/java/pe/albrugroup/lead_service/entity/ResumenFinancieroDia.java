package pe.albrugroup.lead_service.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resumen_financiero_dia", uniqueConstraints = @UniqueConstraint(columnNames = {"fecha", "id_proveedor"}))
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class ResumenFinancieroDia {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate fecha;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor proveedor;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal ctaBancaria = BigDecimal.ZERO;

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal ctaPublicitaria = BigDecimal.ZERO;

    @Column(nullable = false)
    private Instant calculadoAt;

    @OneToMany(mappedBy = "resumenDia", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<ResumenFinancieroDiaZona> zonas = new ArrayList<>();

    public void addZona(ResumenFinancieroDiaZona zona) {
        zona.setResumenDia(this);
        zonas.add(zona);
    }
}
