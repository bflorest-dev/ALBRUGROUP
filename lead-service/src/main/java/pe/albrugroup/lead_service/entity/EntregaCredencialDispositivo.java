package pe.albrugroup.lead_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import pe.albrugroup.lead_service.entity.enums.TipoDispositivo;

import java.time.Instant;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_entrega_dispositivo_entrega", columnList = "id_entrega_credencial"),
        @Index(name = "idx_entrega_dispositivo_marca", columnList = "id_marca_dispositivo")
})
public class EntregaCredencialDispositivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_entrega_credencial", nullable = false)
    private EntregaCredencialPlataforma entregaCredencial;

    @Enumerated(EnumType.STRING)
    private TipoDispositivo tipoDispositivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_marca_dispositivo")
    private MarcaDispositivo marcaDispositivo;

    private String descripcion;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
