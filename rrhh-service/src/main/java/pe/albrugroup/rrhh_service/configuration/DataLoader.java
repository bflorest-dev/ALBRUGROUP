package pe.albrugroup.rrhh_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.*;
import pe.albrugroup.rrhh_service.entity.request.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarEmpleadoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPagoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.PagoRepository;
import pe.albrugroup.rrhh_service.repository.PostulanteRepository;
import pe.albrugroup.rrhh_service.service.ContratoService;
import pe.albrugroup.rrhh_service.service.EmpleadoService;
import pe.albrugroup.rrhh_service.service.PagoService;
import pe.albrugroup.rrhh_service.service.PostulanteService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final PostulanteRepository postulanteRepository;
    private final PostulanteService postulanteService;
    private final EmpleadoRepository empleadoRepository;
    private final EmpleadoService empleadoService;
    private final ContratoRepository contratoRepository;
    private final ContratoService contratoService;
    private final PagoRepository pagoRepository;
    private final PagoService pagoService;

    @Override
    public void run(String... args) throws Exception {
//        if(empleadoRepository.count() == 0) { crearEmpleados(); }
//        if(postulanteRepository.count() == 0) { crearPostulantes(); }
//        if(contratoRepository.count() == 0) { crearContratos(); }
//        if(pagoRepository.count() == 0) { crearPagos(); }
    }

    private void crearPostulantes() {
        RegistrarPostulanteRequest p1 = RegistrarPostulanteRequest.builder()
                .nombres("Alejandro Matias")
                .apellidos("Flores Huanaco")
                .tipoDocumento(Documento.DNI)
                .numeroDocumento("84365398")
                .celularPersonal("999888777")
                .origen(Origen.COMPUTRABAJO)
                .puestoTrabajo(PuestoTrabajo.ASESOR_POSTVENTA)
                .pagoDiaCapacitacion(BigDecimal.valueOf(15.00))
                .fechaInicio(LocalDate.of(2026, 2, 9))
                .fechaFin(LocalDate.of(2026, 2, 14))
                .build();
        RegistrarPostulanteRequest p2 = p1.toBuilder()
                .nombres("Bernardo Alonso")
                .apellidos("Montes Mesa")
                .numeroDocumento("23334546")
                .celularPersonal("989888777")
                .fechaInicio(LocalDate.of(2025, 9, 9))
                .fechaFin(LocalDate.of(2026, 9, 14))
                .build();

        postulanteService.registrarPostulante(p1);
        postulanteService.registrarPostulante(p2);
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
                .correoPersonal("jevbxx@gmail.com")
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
                .correoPersonal("leslie@gmail.com")
                .tieneHijos(true)
                .build();
        RegistrarEmpleadoRequest e3 = e1.toBuilder()
                .nombres("Grace Kelly")
                .apellidos("Cjuno Palacions")
                .numeroDocumento("55413802")
                .celularPersonal("943763303")
                .correoPersonal("grace@gmail.com")
                .tieneHijos(false)
                .build();

        empleadoService.registrarEmpleados(List.of(e1, e2, e3));
    }

    private void crearContratos() {
        RegistrarContratoRequest c1 = RegistrarContratoRequest.builder()
                .puestoTrabajo(PuestoTrabajo.ASESOR_GTR)
                .regimen(Regimen.RECIBO_POR_HONORARIOS)
                .sueldoBase(BigDecimal.valueOf(1150.00))
                .fechaInicio(LocalDate.of(2025, 11,1))
                .build();
        RegistrarContratoRequest c2 = RegistrarContratoRequest.builder()
                .puestoTrabajo(PuestoTrabajo.COMMUNITY)
                .regimen(Regimen.PLANILLA)
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
