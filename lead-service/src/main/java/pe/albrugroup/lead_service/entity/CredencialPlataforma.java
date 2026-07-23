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
import pe.albrugroup.lead_service.entity.enums.EstadoCredencialPlataforma;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(indexes = {
        @Index(name = "idx_credencial_plataforma_paquete", columnList = "id_paquete"),
        @Index(name = "idx_credencial_plataforma_estado", columnList = "estado"),
        @Index(name = "idx_credencial_plataforma_expiracion", columnList = "fechaExpiracion")
})
public class CredencialPlataforma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_paquete", nullable = false)
    private PaquetePlataforma paquete;

    @Column(nullable = false)
    private String usuario;

    @Column(nullable = false)
    private String password;

    private LocalDate fechaCreacion;
    private LocalDate fechaExpiracion;

    @Enumerated(EnumType.STRING)
    private EstadoCredencialPlataforma estado;

    private String observacion;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
