package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class EmpleadoResponse {

    private Long id;
    // DATOS PERSONALES
    private String nombres;
    private String apellidos;
    private Documento tipoDocumento;
    private String numeroDocumento;
    private Nacionalidad nacionalidad;
    private LocalDate fechaNacimiento;
    private EstadoCivil estadoCivil;
    private boolean tieneHijos;
    // CONTACTO
    private String celularPersonal;
    private String celularCorporativo;
    private String correo;
    // UBICACION
    private Distrito distrito;
    private String direccion;
    // INFORMACION FINANCIERA
    private Banco banco;
    private String cuentaBancaria;
    private String cuentaInterbancaria;
    // ESTADO OPERATIVO
    private EstadoOperativo estadoOperativo;
}
