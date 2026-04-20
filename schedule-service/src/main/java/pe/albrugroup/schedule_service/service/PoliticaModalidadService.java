package pe.albrugroup.schedule_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.entity.PoliticaModalidad;
import pe.albrugroup.schedule_service.entity.enums.ModalidadContrato;
import pe.albrugroup.schedule_service.exception.NotFoundException;
import pe.albrugroup.schedule_service.repository.PoliticaModalidadRepository;

@Service
@RequiredArgsConstructor
public class PoliticaModalidadService {

    private final PoliticaModalidadRepository politicaModalidadRepository;

    public PoliticaModalidad getPolitica(ModalidadContrato modalidad) {
        return politicaModalidadRepository.findByModalidad(modalidad)
                .orElseThrow(() -> new NotFoundException("Politica de modalidad no encontrada", modalidad));
    }

    public void aplicarPolitica(Horario horario, PoliticaModalidad politica) {
        horario.setPoliticaModalidad(politica);
        horario.setModalidadContrato(politica.getModalidad());
        horario.setHorasObjetivoSemanal(politica.getHorasObjetivoSemanal());
        horario.setHorasObjetivoMensual(politica.getHorasObjetivoMensual());
        horario.setMinutosAlmuerzo(politica.getMinutosAlmuerzo());
        horario.setMinutosServicios(politica.getMinutosServicios());
    }
}
