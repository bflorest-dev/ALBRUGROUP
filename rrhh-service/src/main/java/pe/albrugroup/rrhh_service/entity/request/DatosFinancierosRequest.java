package pe.albrugroup.rrhh_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Banco;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class DatosFinancierosRequest {

    // INFORMACION FINANCIERA
    @NotNull
    private Banco banco;
    @NotBlank
    private String cuentaBancaria;
    @NotBlank
    private String cuentaInterbancaria;
}
