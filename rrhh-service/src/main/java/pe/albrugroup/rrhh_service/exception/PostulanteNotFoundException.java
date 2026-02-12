package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class PostulanteNotFoundException extends BusinessException {
    public PostulanteNotFoundException(Long idPostulante) {
        super(
                HttpStatus.NOT_FOUND,
                "Postulante no existe",
                idPostulante
        );
    }
}
