package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class BaseLeadsExportRequest {

    @Valid
    @NotNull
    private BaseLeadsExportFilter filter;

    @NotBlank
    private String origenCodigo;

    @Min(100)
    @Max(5000)
    private int maxLeadsPorArchivo = 1000;
}
