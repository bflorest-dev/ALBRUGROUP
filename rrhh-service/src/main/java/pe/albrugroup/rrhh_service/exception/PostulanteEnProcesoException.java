package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class PostulanteEnProcesoException extends BusinessException {
    public PostulanteEnProcesoException() {
        super(
                HttpStatus.CONFLICT,
                "Postulante ya tiene una Postulacion en curso"
        );
    }
}
