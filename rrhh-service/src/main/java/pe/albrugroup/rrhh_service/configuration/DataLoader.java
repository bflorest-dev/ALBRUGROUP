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

    private EmpleadoService empleadoService;

    @Override
    public void run(String... args) throws Exception {

    }

}
