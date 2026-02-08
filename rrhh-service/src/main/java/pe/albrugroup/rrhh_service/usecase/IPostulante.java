package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.request.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

import java.time.LocalDate;
import java.util.List;

@Component
public interface IPostulante {

    List<PostulanteResponse> getPostulantesEstadoFechas(EstadoPostulacion estado, LocalDate desde, LocalDate hasta);
    PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante);
}
