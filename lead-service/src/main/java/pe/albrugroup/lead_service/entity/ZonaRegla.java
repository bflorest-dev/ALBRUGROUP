package pe.albrugroup.lead_service.entity;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.lead_service.entity.enums.CriterioZona;
import pe.albrugroup.lead_service.entity.enums.NivelGeografico;

import java.time.Instant;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"zona_id", "nivel_geografico", "geo_id", "criterio"}))
public class ZonaRegla {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "zona_id", nullable = false)
    private Zona zona;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_geografico", nullable = false)
    private NivelGeografico nivelGeografico;

    @Column(name = "geo_id", nullable = false)
    private Long geoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CriterioZona criterio;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
