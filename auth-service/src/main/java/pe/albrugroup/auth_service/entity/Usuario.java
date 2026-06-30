package pe.albrugroup.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(name = "usuarios")
public class Usuario {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true)
    private String username;
    private String password;
    @Column(unique = true)
    private String email;

    @Column(name = "empleado_id", unique = true)
    private Long empleadoId;
    @Column(name = "dni", nullable = false)
    private String dni;
    @Column(name = "nombre_completo")
    private String nombreCompleto;
    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
    @Column(name = "password_inicializada", nullable = false)
    @Builder.Default
    private Boolean passwordInicializada = false;

    @CreationTimestamp @Column(updatable = false)
    private Instant createdAt;
    @UpdateTimestamp
    private Instant updatedAt;

//    @Column(name = "fecha_Creacion")
//    private LocalDateTime fechaCreacion;
//    @Column(name = "fecha_Actualizacion")
//    private LocalDateTime fechaActualizacion;
//
//    @PrePersist
//    protected void onCreate() {
//        this.fechaCreacion = LocalDateTime.now();
//        this.fechaActualizacion = LocalDateTime.now();
//    }
//    @PreUpdate
//    protected void onUpdate() {
//        this.fechaActualizacion = LocalDateTime.now();
//    }

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_rol",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    @Builder.Default
    private Set<Rol> roles = new HashSet<>();

    // Equipos a los que pertenece el usuario (partición de datos, ortogonal al rol).
    // Roles operativos: normalmente 1 equipo (ASESOR_VENTAS puede pertenecer a varios);
    // ADMIN/COMMUNITY: sin equipo (acceso global por permiso).
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_equipo",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "equipo_id")
    )
    @Builder.Default
    private Set<Equipo> equipos = new HashSet<>();
}
