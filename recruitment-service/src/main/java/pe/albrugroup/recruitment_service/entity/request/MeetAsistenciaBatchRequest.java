package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record MeetAsistenciaBatchRequest(
        @NotEmpty @Size(max = 100) List<@Valid MeetAsistenciaBatchItemRequest> items
) {
}
