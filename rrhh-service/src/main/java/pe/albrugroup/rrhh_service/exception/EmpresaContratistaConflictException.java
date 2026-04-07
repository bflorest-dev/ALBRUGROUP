package pe.albrugroup.rrhh_service.exception;

public class EmpresaContratistaConflictException extends ConflictException {

    public EmpresaContratistaConflictException(String nombre) {
        super("La empresa contratista ya existe", nombre);
    }
}
