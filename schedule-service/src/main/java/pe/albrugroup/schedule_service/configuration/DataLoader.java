package pe.albrugroup.schedule_service.configuration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;
import pe.albrugroup.schedule_service.repository.PoliticaModalidadRepository;

@Component
@Profile("dev")
@Slf4j
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final PoliticaModalidadRepository politicaModalidadRepository;

    @Override
    public void run(String... args) {
        log.info("Cargando politicas de modalidad iniciales...");

        // minutosOperativosDia: horas operativas netas/dia (sin almuerzo). Base del objetivo.
        savePolitica(ModalidadContrato.PART_TIME, 24, 96, 30, 20, 240);
        savePolitica(ModalidadContrato.SEMI_FULL, 36, 144, 45, 25, 360);
        savePolitica(ModalidadContrato.FULL_TIME, 48, 192, 60, 30, 480);
        savePolitica(ModalidadContrato.SUPER_FULL, 54, 216, 60, 35, 600);

        log.info("Politicas de modalidad iniciales cargadas");
    }

    private void savePolitica(
            ModalidadContrato modalidad,
            Integer horasObjetivoSemanal,
            Integer horasObjetivoMensual,
            Integer minutosAlmuerzo,
            Integer minutosServicios,
            Integer minutosOperativosDia
    ) {
        PoliticaModalidad politica = politicaModalidadRepository.findByModalidad(modalidad)
                .orElseGet(PoliticaModalidad::new);

        politica.setModalidad(modalidad);
        politica.setHorasObjetivoSemanal(horasObjetivoSemanal);
        politica.setHorasObjetivoMensual(horasObjetivoMensual);
        politica.setMinutosAlmuerzo(minutosAlmuerzo);
        politica.setMinutosServicios(minutosServicios);
        politica.setMinutosOperativosDia(minutosOperativosDia);

        politicaModalidadRepository.save(politica);
    }
}
