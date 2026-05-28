package pe.albrugroup.call_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import pe.albrugroup.call_service.entity.enums.FormatoGrabacion;

import java.time.Instant;

/**
 * Metadata de una grabacion de llamada.
 * El binario vive en MinIO (storageUrl); aqui solo info para listar/buscar.
 */
@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "grabaciones", indexes = {
        @Index(name = "idx_recording_call", columnList = "id_call"),
        @Index(name = "idx_recording_disponible", columnList = "disponibleHasta")
})
public class Recording {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_call")
    private Call call;

    /** Nombre base del archivo (sin path), ej. {linkedId}_{timestamp}. */
    @Column(length = 128)
    private String filename;

    @Enumerated(EnumType.STRING)
    private FormatoGrabacion formato;

    private Integer durationSeconds;
    private Long sizeBytes;

    /** URL/objectKey en MinIO (ej. "recordings/2026/05/27/abc.mp3"). */
    @Column(length = 512)
    private String storageObjectKey;

    /** SHA-256 del archivo para verificar integridad. */
    @Column(length = 64)
    private String hashSha256;

    /** Hasta cuando esta disponible (politica de retencion). */
    private Instant disponibleHasta;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
}
