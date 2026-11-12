package pe.albrugroup.lead_service.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.enums.ColumnaUniversal;
import pe.albrugroup.lead_service.entity.request.BuscadorUniversalFilter;
import pe.albrugroup.lead_service.entity.response.ColumnaMetadataResponse;
import pe.albrugroup.lead_service.entity.response.ColumnaMetadataResponse.ColumnaInfo;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BuscadorUniversalService {

    private final EntityManager entityManager;

    public Page<Map<String, Object>> buscar(BuscadorUniversalFilter filter, Pageable pageable) {
        var builder = new BuscadorUniversalQueryBuilder(filter);

        long total = count(builder);
        if (total == 0 || pageable.getOffset() >= total) {
            return new PageImpl<>(List.of(), pageable, total);
        }

        TypedQuery<Object[]> query = entityManager.createQuery(builder.buildDataQuery(), Object[].class);
        builder.getParams().forEach(query::setParameter);
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<ColumnaUniversal> columnas = builder.getColumnasOrdenadas();
        List<Map<String, Object>> rows = query.getResultList().stream()
                .map(row -> toMap(row, columnas))
                .toList();

        return new PageImpl<>(rows, pageable, total);
    }

    public List<ColumnaMetadataResponse> listarColumnas() {
        return Arrays.stream(ColumnaUniversal.Fuente.values())
                .map(fuente -> {
                    List<ColumnaInfo> cols = Arrays.stream(ColumnaUniversal.values())
                            .filter(c -> c.getFuente() == fuente)
                            .map(c -> new ColumnaInfo(c.name(), c.getLabel()))
                            .toList();
                    return new ColumnaMetadataResponse(fuente.getLabel(), cols);
                })
                .filter(g -> !g.columnas().isEmpty())
                .toList();
    }

    private long count(BuscadorUniversalQueryBuilder builder) {
        TypedQuery<Long> countQuery = entityManager.createQuery(builder.buildCountQuery(), Long.class);
        builder.getParams().forEach(countQuery::setParameter);
        return countQuery.getSingleResult();
    }

    private Map<String, Object> toMap(Object[] row, List<ColumnaUniversal> columnas) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", row[0]);
        for (int i = 0; i < columnas.size(); i++) {
            Object val = row[i + 1];
            if (val != null) {
                map.put(columnas.get(i).name(), val);
            }
        }
        return map;
    }
}
