package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class BaseLeadsExcelExportRequest {

    @Valid
    @NotNull
    private BaseLeadsExportFilter filter;
}
