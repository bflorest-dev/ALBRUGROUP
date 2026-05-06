package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ProveedorRequest {

    @NotBlank
    private String nombre;
    private Set<@Min(1) @Max(31) Integer> cortesFacturacion;
    @Min(1)
    private Integer mesesPermanencia;
}
