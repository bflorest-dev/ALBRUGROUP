package pe.albrugroup.schedule_service.configuration;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;
import pe.albrugroup.schedule_service.repository.PoliticaModalidadRepository;

import java.util.Arrays;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final PoliticaModalidadRepository politicaModalidadRepository;

    @Override
    public void run(String... args) {
        if (politicaModalidadRepository.count() > 0) {
            return;
        }

        Arrays.asList(
                PoliticaModalidad.builder().modalidad(ModalidadContrato.PART_TIME)
                        .horasObjetivoSemanal(24)
                        .horasObjetivoMensual(96)
                        .minutosAlmuerzo(30)
                        .minutosServicios(20)
                        .build(),
                PoliticaModalidad.builder().modalidad(ModalidadContrato.SEMI_FULL)
                        .horasObjetivoSemanal(36)
                        .horasObjetivoMensual(144)
                        .minutosAlmuerzo(45)
                        .minutosServicios(25)
                        .build(),
                PoliticaModalidad.builder().modalidad(ModalidadContrato.FULL_TIME)
                        .horasObjetivoSemanal(48)
                        .horasObjetivoMensual(192)
                        .minutosAlmuerzo(60)
                        .minutosServicios(30)
                        .build(),
                PoliticaModalidad.builder().modalidad(ModalidadContrato.SUPER_FULL)
                        .horasObjetivoSemanal(54)
                        .horasObjetivoMensual(216)
                        .minutosAlmuerzo(60)
                        .minutosServicios(35)
                        .build()
        ).forEach(politicaModalidadRepository::save);
    }
}
