package pe.albrugroup.lead_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FlujoMatrizTipificacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "matriz_id", nullable = false)
    private MatrizTipificacion matriz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipificacion_origen_id")
    private Tipificacion tipificacionOrigen;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tipificacion_destino_id", nullable = false)
    private Tipificacion tipificacionDestino;

    @Column(nullable = false)
    private Boolean activo = Boolean.TRUE;
}
