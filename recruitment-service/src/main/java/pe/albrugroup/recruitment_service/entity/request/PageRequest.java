package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PageRequest {

    @Builder.Default
    @Min(value = 0, message = "pageNumber debe ser mayor o igual a 0")
    private int pageNumber = 0;

    @Builder.Default
    @Min(value = 1, message = "pageSize debe ser mayor o igual a 1")
    @Max(value = 100, message = "pageSize no debe ser mayor a 100")
    private int pageSize = 8;

    @Builder.Default
    @NotBlank(message = "sortBy es obligatorio")
    private String sortBy = "createdAt";

    @Builder.Default
    @NotBlank(message = "direction es obligatorio")
    private String direction = "asc";
}
