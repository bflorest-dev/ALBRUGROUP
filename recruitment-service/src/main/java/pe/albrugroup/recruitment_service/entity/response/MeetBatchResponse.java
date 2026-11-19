package pe.albrugroup.recruitment_service.entity.response;

import java.util.List;

public record MeetBatchResponse(
        int procesados,
        List<Long> idsPostulaciones
) {
}
