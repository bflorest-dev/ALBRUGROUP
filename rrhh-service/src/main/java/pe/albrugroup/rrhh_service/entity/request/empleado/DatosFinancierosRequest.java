package pe.albrugroup.rrhh_service.entity.request.empleado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Parentesco;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class DatosFinancierosRequest {

    // INFORMACION FINANCIERA
    @NotNull private Banco banco;
    @NotBlank private String cuentaBancaria;
    @NotBlank private String cuentaInterbancaria;
    @NotNull private Boolean cuentaPropia;
    private Parentesco parentesco;
    private String celularTransferencia;
    @Positive private Long idEmpresaContratista;
}
