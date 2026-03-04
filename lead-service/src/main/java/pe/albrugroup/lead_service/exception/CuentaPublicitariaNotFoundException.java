package pe.albrugroup.lead_service.exception;

import org.springframework.http.HttpStatus;

public class CuentaPublicitariaNotFoundException extends BusinessException {

    public CuentaPublicitariaNotFoundException(Long idCuentaPublicitaria) {
        super(
                HttpStatus.BAD_REQUEST,
                "Cuenta publicitaria no encontrada",
                idCuentaPublicitaria
        );
    }
}
