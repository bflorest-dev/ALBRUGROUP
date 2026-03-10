package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ZonaRequest {

    @NotBlank
    private String nombre;

    @NotEmpty @Valid @Builder.Default
    private List<ZonaReglaRequest> reglas = new ArrayList<>();
}
