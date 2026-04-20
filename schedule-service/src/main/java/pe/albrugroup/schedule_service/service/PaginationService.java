package pe.albrugroup.schedule_service.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import pe.albrugroup.schedule_service.exception.BadRequestException;

import java.util.Set;

@Service
public class PaginationService {

    public Pageable buildPageable(pe.albrugroup.schedule_service.entity.request.PageRequest request, Set<String> allowedSortFields) {
        String direction = request.getDirection().toLowerCase();
        if (!direction.equals("asc") && !direction.equals("desc")) {
            throw new BadRequestException("direction debe ser asc o desc");
        }
        if (!allowedSortFields.contains(request.getSortBy())) {
            throw new BadRequestException("Campo de ordenamiento no permitido: " + request.getSortBy());
        }
        Sort sort = Sort.by(direction.equals("asc") ? Sort.Direction.ASC : Sort.Direction.DESC, request.getSortBy());
        return PageRequest.of(request.getPageNumber(), request.getPageSize(), sort);
    }
}
