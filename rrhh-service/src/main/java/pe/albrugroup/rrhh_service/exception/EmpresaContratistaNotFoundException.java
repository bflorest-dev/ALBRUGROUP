package pe.albrugroup.rrhh_service.exception;

import org.springframework.http.HttpStatus;

public class EmpresaContratistaNotFoundException extends BusinessException {

    public EmpresaContratistaNotFoundException(Long idEmpresaContratista) {
        super(
                HttpStatus.NOT_FOUND,
                "Empresa contratista no existe",
                idEmpresaContratista
        );
    }
}
