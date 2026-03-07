package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class CampanaNotFoundException extends BusinessException {

    public CampanaNotFoundException(Long idCampana) {
        super(
                HttpStatus.NOT_FOUND,
                "Campana no encontrada",
                idCampana
        );
    }
}
