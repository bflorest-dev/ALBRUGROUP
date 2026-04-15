package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.*;

import java.time.Instant;
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
    private Boolean tieneHijos;
    // CONTACTO
    private String celularPersonal;
    private String correoPersonal;
    // CONTACTO CORPORATIVO
    private String celularCorporativo;
    private String correoCorporativo;
    // UBICACION
    private Origen origen;
    private Distrito distrito;
    private String direccion;
    // INFORMACION FINANCIERA
    private Banco banco;
    private String cuentaBancaria;
    private String cuentaInterbancaria;
    private Boolean cuentaPropia;
    private Parentesco parentesco;
    private String celularTransferencia;
    private String empresaContratista;
    // ESTADO OPERATIVO
    private EstadoOperativo estadoOperativo;
    private Compania compania;
    private Boolean listaNegra;
    private Instant createdAt;
    private Instant updatedAt;
}
