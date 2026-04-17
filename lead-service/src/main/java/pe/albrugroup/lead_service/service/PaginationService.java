package pe.albrugroup.lead_service.service;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;

import java.util.Set;

@Service
public class PaginationService {

    public Pageable toPageable(PageRequest request, Set<String> allowedSortFields) {
        validateDirection(request.getDirection());
        validateSortBy(request.getSortBy(), allowedSortFields);

        Sort.Direction direction = Sort.Direction.fromString(request.getDirection());
        return org.springframework.data.domain.PageRequest.of(
                request.getPageNumber(),
                request.getPageSize(),
                Sort.by(direction, request.getSortBy())
        );
    }

    private void validateDirection(String direction) {
        if (!direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc")) {
            throw new BadRequestException("direction debe ser asc o desc");
        }
    }

    private void validateSortBy(String sortBy, Set<String> allowedSortFields) {
        if (!allowedSortFields.contains(sortBy)) {
            throw new BadRequestException("Campo de ordenamiento no permitido: " + sortBy);
        }
    }
}
