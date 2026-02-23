package pe.albrugroup.rrhh_service.usecase;

import org.springframework.stereotype.Component;
import pe.albrugroup.rrhh_service.entity.request.postulante.RegistrarPostulanteRequest;
import pe.albrugroup.rrhh_service.entity.response.PostulanteResponse;

@Component
public interface IPostulante {

    PostulanteResponse registrarPostulante(RegistrarPostulanteRequest nuevoPostulante, Long responsableId);

//    List<PostulanteResponse> getPostulantesFiltrados(
//            EstadoPostulacion estado, PuestoTrabajo puesto, LocalDate desde, LocalDate hasta);
//    PostulanteResponse actulizarPostulante(Long idPostulante, DatosPostulanteRequest infoPostulante);
//    List<PostulanteResponse> actualizarEstadosPostulacion(CambiosEstadoPostulacionRequest cambios);
}
