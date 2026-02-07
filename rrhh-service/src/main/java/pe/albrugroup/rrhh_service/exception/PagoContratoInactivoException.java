package pe.albrugroup.rrhh_service.exception;

public class PagoContratoInactivoException extends RuntimeException {
    public PagoContratoInactivoException(Long idContrato) {
        super("No se puede pagar el Contrato[" + idContrato + "] porque esta Inactivo");
    }
}
