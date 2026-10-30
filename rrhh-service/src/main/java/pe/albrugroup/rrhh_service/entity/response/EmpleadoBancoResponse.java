package pe.albrugroup.rrhh_service.entity.response;

public record EmpleadoBancoResponse(
        Long idEmpleado,
        String banco,
        String cuentaBancaria,
        String cuentaInterbancaria
) {
}
