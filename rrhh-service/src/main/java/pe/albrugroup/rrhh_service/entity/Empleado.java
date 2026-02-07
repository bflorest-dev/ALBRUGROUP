package pe.albrugroup.rrhh_service.entity;

import jakarta.persistence.*;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity @Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
@Table(
        name = "empleados",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_empleado_numero_documento", columnNames = "numero_documento"),
                @UniqueConstraint(name = "uk_empleado_celular_personal", columnNames = "celular_personal"),
                @UniqueConstraint(name = "uk_empleado_correo", columnNames = "correo")
        }
)
public class Empleado {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // RELACIONES
    @OneToMany(mappedBy = "empleado", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Contrato> contratos = new ArrayList<>();
    // DATOS PERSONALES
    private String nombres;
    private String apellidos;
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_documento")
    private Documento tipoDocumento;
    @Column(name = "numero_documento")
    private String numeroDocumento;
    @Enumerated(EnumType.STRING)
    private Nacionalidad nacionalidad;
    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_civil")
    private EstadoCivil estadoCivil;
    private boolean tieneHijos;
    // CONTACTO
    @Column(name = "celular_personal")
    private String celularPersonal;
    @Column(name = "celular_corporativo")
    private String celularCorporativo;
    @Column(unique = true, nullable = false)
    private String correo;
    // UBICACION
    @Enumerated(EnumType.STRING)
    private Distrito distrito;
    private String direccion;
    // INFORMACION FINANCIERA
    @Enumerated(EnumType.STRING)
    private Banco banco;
    @Column(name = "cuenta_bancaria")
    private String cuentaBancaria;
    @Column(name = "cuenta_interbancaria")
    private String cuentaInterbancaria;
    // ESTADO OPERATIVO
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_operativo")
    private EstadoOperativo estadoOperativo;
}
