package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpresaContratistaConflictException extends BusinessException {

    public EmpresaContratistaConflictException(String nombre) {
        super(
                HttpStatus.CONFLICT,
                "La empresa contratista ya existe",
                nombre
        );
    }
}
