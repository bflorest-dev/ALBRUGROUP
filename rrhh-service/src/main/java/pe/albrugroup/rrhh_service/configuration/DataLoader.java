package pe.albrugroup.rrhh_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private final EmpresaContratistaRepository empresaContratistaRepository;

    @PostConstruct
    public void loadData() {
        log.info("Cargando empresas contratistas iniciales...");
        crearEmpresaContratista("Albru");
        crearEmpresaContratista("Runa");
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
}
