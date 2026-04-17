package pe.albrugroup.rrhh_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Compania;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.EstadoCivil;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.Nacionalidad;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.Parentesco;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;

import java.time.LocalDate;

@Component
@Profile("dev")
@Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private static final String ADMIN_NOMBRES = "Edinson";
    private static final String ADMIN_APELLIDOS = "Vitterio";
    private static final Documento ADMIN_TIPO_DOCUMENTO = Documento.DNI;
    private static final String ADMIN_NUMERO_DOCUMENTO = "75413802";
    private static final Nacionalidad ADMIN_NACIONALIDAD = Nacionalidad.PERUANO;
    private static final LocalDate ADMIN_FECHA_NACIMIENTO = LocalDate.of(1999, 3, 6);
    private static final EstadoCivil ADMIN_ESTADO_CIVIL = EstadoCivil.SOLTERO;
    private static final boolean ADMIN_TIENE_HIJOS = false;
    private static final String ADMIN_CELULAR_PERSONAL = "943763301";
    private static final String ADMIN_CORREO_PERSONAL = "jevbxx@gmail.com";
    private static final String ADMIN_CELULAR_CORPORATIVO = "943763301";
    private static final String ADMIN_CORREO_CORPORATIVO = "admin@albru.admin.pe";
    private static final Origen ADMIN_ORIGEN = Origen.COMPUTRABAJO;
    private static final Distrito ADMIN_DISTRITO = Distrito.CALLAO;
    private static final String ADMIN_DIRECCION = "Prolongacion Centenario 07046";
    private static final Banco ADMIN_BANCO = Banco.BCP;
    private static final String ADMIN_CUENTA_BANCARIA = "12345678901";
    private static final String ADMIN_CUENTA_INTERBANCARIA = "00212345678901234567";
    private static final boolean ADMIN_CUENTA_PROPIA = true;
    private static final Parentesco ADMIN_PARENTESCO = null;
    private static final String ADMIN_CELULAR_TRANSFERENCIA = null;
    private static final String ADMIN_EMPRESA_CONTRATISTA = "Albru";
    private static final Compania ADMIN_COMPANIA = Compania.ALBRU;

    private final EmpresaContratistaRepository empresaContratistaRepository;
    private final EmpleadoRepository empleadoRepository;

    @PostConstruct
    public void loadData() {
        log.info("Cargando empresas contratistas iniciales...");
        crearEmpresaContratista("Albru");
        crearEmpresaContratista("Runa");
        crearOActualizarEmpleadoAdmin();
        log.info("Empresas contratistas iniciales cargadas");
    }

    private void crearEmpresaContratista(String nombre) {
        if (empresaContratistaRepository.existsByNombreIgnoreCase(nombre)) {
            return;
        }

        empresaContratistaRepository.save(
                EmpresaContratista.builder()
                        .nombre(nombre)
                        .activo(true)
                        .build()
        );
    }

    private void crearOActualizarEmpleadoAdmin() {
        EmpresaContratista empresaContratista = empresaContratistaRepository.findByActivoOrderByNombreAsc(true).stream()
                .filter(item -> item.getNombre().equalsIgnoreCase(ADMIN_EMPRESA_CONTRATISTA))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Empresa contratista seed no encontrada: " + ADMIN_EMPRESA_CONTRATISTA));

        Empleado adminEmpleado = empleadoRepository.findByNumeroDocumento(ADMIN_NUMERO_DOCUMENTO)
                .orElseGet(Empleado::new);

        adminEmpleado.setNombres(ADMIN_NOMBRES);
        adminEmpleado.setApellidos(ADMIN_APELLIDOS);
        adminEmpleado.setTipoDocumento(ADMIN_TIPO_DOCUMENTO);
        adminEmpleado.setNumeroDocumento(ADMIN_NUMERO_DOCUMENTO);
        adminEmpleado.setNacionalidad(ADMIN_NACIONALIDAD);
        adminEmpleado.setFechaNacimiento(ADMIN_FECHA_NACIMIENTO);
        adminEmpleado.setEstadoCivil(ADMIN_ESTADO_CIVIL);
        adminEmpleado.setTieneHijos(ADMIN_TIENE_HIJOS);
        adminEmpleado.setCelularPersonal(ADMIN_CELULAR_PERSONAL);
        adminEmpleado.setCorreoPersonal(ADMIN_CORREO_PERSONAL);
        adminEmpleado.setCelularCorporativo(ADMIN_CELULAR_CORPORATIVO);
        adminEmpleado.setCorreoCorporativo(ADMIN_CORREO_CORPORATIVO);
        adminEmpleado.setOrigen(ADMIN_ORIGEN);
        adminEmpleado.setDistrito(ADMIN_DISTRITO);
        adminEmpleado.setDireccion(ADMIN_DIRECCION);
        adminEmpleado.setBanco(ADMIN_BANCO);
        adminEmpleado.setCuentaBancaria(ADMIN_CUENTA_BANCARIA);
        adminEmpleado.setCuentaInterbancaria(ADMIN_CUENTA_INTERBANCARIA);
        adminEmpleado.setCuentaPropia(ADMIN_CUENTA_PROPIA);
        adminEmpleado.setParentesco(ADMIN_PARENTESCO);
        adminEmpleado.setCelularTransferencia(ADMIN_CELULAR_TRANSFERENCIA);
        adminEmpleado.setEmpresaContratista(empresaContratista);
        adminEmpleado.setEstadoOperativo(EstadoOperativo.ACTIVO);
        adminEmpleado.setCompania(ADMIN_COMPANIA);
        adminEmpleado.setListaNegra(false);

        adminEmpleado = empleadoRepository.save(adminEmpleado);
        log.info("Empleado administrador seed listo con id {} y documento {}", adminEmpleado.getId(), ADMIN_NUMERO_DOCUMENTO);
    }
}
