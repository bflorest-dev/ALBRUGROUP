package pe.albrugroup.rrhh_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.*;
import pe.albrugroup.rrhh_service.entity.request.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarEmpleadoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PagoRepository;
import pe.albrugroup.rrhh_service.service.ContratoService;
import pe.albrugroup.rrhh_service.service.EmpleadoService;
import pe.albrugroup.rrhh_service.service.PagoService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final EmpleadoRepository empleadoRepository;
    private final EmpleadoService empleadoService;
    private final ContratoRepository contratoRepository;
    private final ContratoService contratoService;
    private final PagoRepository pagoRepository;
    private final PagoService pagoService;

    @Override
    public void run(String... args) throws Exception {
        if(empleadoRepository.count() == 0) { crearEmpleados(); }
        if(contratoRepository.count() == 0) { crearContratos(); }
        if(pagoRepository.count() == 0) { crearPagos(); }
    }

    private void crearEmpleados() {
        RegistrarEmpleadoRequest e1 = RegistrarEmpleadoRequest.builder()
                .nombres("Julio Edinson")
                .apellidos("Vitterio Bernuy")
                .tipoDocumento(Documento.DNI)
                .numeroDocumento("75413802")
                .nacionalidad(Nacionalidad.PERUANO)
                .fechaNacimiento(LocalDate.of(1999,3,6))
                .estadoCivil(EstadoCivil.SOLTERO)
                .tieneHijos(false)
                .celularPersonal("943763301")
                .celularCorporativo("943763301")
                .correo("jevbxx@gmail.com")
                .distrito(Distrito.SAN_MARTÍN_DE_PORRES)
                .direccion("Fermin Tanguis 079")
                .banco(Banco.BCP)
                .cuentaBancaria("12344677890")
                .cuentaInterbancaria("09876543234343")
                .build();
        RegistrarEmpleadoRequest e2 = e1.toBuilder()
                .nombres("Leslie Khaterine")
                .apellidos("Linare Castellano")
                .numeroDocumento("65413802")
                .celularPersonal("943763302")
                .correo("leslie@gmail.com")
                .tieneHijos(true)
                .build();
        RegistrarEmpleadoRequest e3 = e1.toBuilder()
                .nombres("Grace Kelly")
                .apellidos("Cjuno Palacions")
                .numeroDocumento("55413802")
                .celularPersonal("943763303")
                .correo("grace@gmail.com")
                .tieneHijos(false)
                .build();

        empleadoService.registrarEmpleados(List.of(e1, e2, e3));
    }

    private void crearContratos() {
        RegistrarContratoRequest c1 = RegistrarContratoRequest.builder()
                .puestoTrabajo(PuestoTrabajo.ASESOR_GTR)
                .modalidad(Modalidad.RECIBO_POR_HONORARIOS)
                .sueldoBase(BigDecimal.valueOf(1150.00))
                .fechaInicio(LocalDate.of(2025, 11,1))
                .build();
        RegistrarContratoRequest c2 = RegistrarContratoRequest.builder()
                .puestoTrabajo(PuestoTrabajo.COMMUNITY)
                .modalidad(Modalidad.PLANILLA)
                .sueldoBase(BigDecimal.valueOf(1030.00))
                .fechaInicio(LocalDate.of(2026, 1,1))
                .build();
        Long id1 = 2L; Long id2 = 3L;

        contratoService.registrarContratos(List.of(id1, id2),List.of(c1, c2));
    }

    private void crearPagos() {
        RegistrarPagoRequest p1 = RegistrarPagoRequest.builder()
                .fechaInicio(LocalDate.of(2025, 11,1))
                .fechaFin(LocalDate.of(2025, 11,30))
                .sueldoBase(BigDecimal.valueOf(1150.00))
                .asignacionFamiliar(BigDecimal.valueOf(80.00))
                .comision(BigDecimal.valueOf(150.00))
                .sueldoTotal(BigDecimal.valueOf(2500.00))
                .build();
        RegistrarPagoRequest p2 = RegistrarPagoRequest.builder()
                .fechaInicio(LocalDate.of(2025, 12,1))
                .fechaFin(LocalDate.of(2025, 12,31))
                .sueldoBase(BigDecimal.valueOf(1150.00))
                .asignacionFamiliar(BigDecimal.valueOf(80.00))
                .comision(BigDecimal.valueOf(150.00))
                .sueldoTotal(BigDecimal.valueOf(2500.00))
                .build();
        RegistrarPagoRequest p3 = RegistrarPagoRequest.builder()
                .fechaInicio(LocalDate.of(2026, 1,1))
                .fechaFin(LocalDate.of(2026, 1,31))
                .sueldoBase(BigDecimal.valueOf(1030.00))
                .asignacionFamiliar(BigDecimal.valueOf(80.00))
                .comision(BigDecimal.valueOf(150.00))
                .sueldoTotal(BigDecimal.valueOf(2200.00))
                .build();
        Long id1 = 1L; Long id2 = 2L;

        pagoService.registrarPago(id1, p1);
        pagoService.registrarPago(id1, p2);
        pagoService.registrarPago(id2, p3);
    }
}
