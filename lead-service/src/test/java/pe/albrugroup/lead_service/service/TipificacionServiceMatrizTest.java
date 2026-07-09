package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.MatrizCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.SubtipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionCatalogoRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TipificacionServiceMatrizTest {

    @Mock private TipificacionRepository tipificacionRepository;
    @Mock private SubtipificacionRepository subtipificacionRepository;
    @Mock private TipificacionMapper mapper;

    private TipificacionService service;
    private final AtomicLong tipificacionId = new AtomicLong(100);
    private final AtomicLong subtipificacionId = new AtomicLong(200);

    @BeforeEach
    void setUp() {
        service = new TipificacionService(tipificacionRepository, subtipificacionRepository, mapper);
        lenient().when(tipificacionRepository.save(any(Tipificacion.class))).thenAnswer(invocation -> {
            Tipificacion entity = invocation.getArgument(0);
            if (entity.getId() == null) {
                entity.setId(tipificacionId.incrementAndGet());
            }
            return entity;
        });
        lenient().when(subtipificacionRepository.save(any(Subtipificacion.class))).thenAnswer(invocation -> {
            Subtipificacion entity = invocation.getArgument(0);
            if (entity.getId() == null) {
                entity.setId(subtipificacionId.incrementAndGet());
            }
            return entity;
        });
    }

    @Test
    void guardaEdicionesYRecalculaOrdenDesdeLaPosicion() {
        Tipificacion primera = tipificacion(1L, "PRIMERA", 1, true);
        Tipificacion segunda = tipificacion(2L, "SEGUNDA", 2, true);
        when(tipificacionRepository.findByEtapaOrderByOrdenAsc(Etapa.PREVENTA))
                .thenReturn(List.of(primera, segunda));
        when(subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(List.of(primera, segunda)))
                .thenReturn(List.of());

        service.guardarMatrizCatalogo(matriz(
                tipRequest(2L, "SEGUNDA_EDITADA", "Segunda editada", List.of()),
                tipRequest(1L, "PRIMERA", "Primera", List.of())
        ));

        assertThat(segunda.getCodigo()).isEqualTo("SEGUNDA_EDITADA");
        assertThat(segunda.getDescripcion()).isEqualTo("Segunda editada");
        assertThat(segunda.getOrden()).isEqualTo(1);
        assertThat(primera.getOrden()).isEqualTo(2);
        assertThat(primera.getActivo()).isTrue();
        assertThat(segunda.getActivo()).isTrue();
    }

    @Test
    void permiteIntercambiarCodigosEnUnaSolaMatriz() {
        Tipificacion primera = tipificacion(1L, "PRIMERA", 1, true);
        Tipificacion segunda = tipificacion(2L, "SEGUNDA", 2, true);
        when(tipificacionRepository.findByEtapaOrderByOrdenAsc(Etapa.PREVENTA))
                .thenReturn(List.of(primera, segunda));
        when(subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(List.of(primera, segunda)))
                .thenReturn(List.of());

        service.guardarMatrizCatalogo(matriz(
                tipRequest(1L, "SEGUNDA", "Ahora segunda", List.of()),
                tipRequest(2L, "PRIMERA", "Ahora primera", List.of())
        ));

        assertThat(primera.getCodigo()).isEqualTo("SEGUNDA");
        assertThat(segunda.getCodigo()).isEqualTo("PRIMERA");
        assertThat(primera.getActivo()).isTrue();
        assertThat(segunda.getActivo()).isTrue();
    }

    @Test
    void omitirElementosLosDesactivaSinBorrarlos() {
        Tipificacion conservar = tipificacion(1L, "CONSERVAR", 1, true);
        Tipificacion retirar = tipificacion(2L, "RETIRAR", 2, true);
        Subtipificacion retirarSub = subtipificacion(20L, retirar, "RETIRAR_SUB", 1, true);
        when(tipificacionRepository.findByEtapaOrderByOrdenAsc(Etapa.PREVENTA))
                .thenReturn(List.of(conservar, retirar));
        when(subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(List.of(conservar, retirar)))
                .thenReturn(List.of(retirarSub));

        service.guardarMatrizCatalogo(matriz(
                tipRequest(1L, "CONSERVAR", "Conservar", List.of())
        ));

        assertThat(retirar.getActivo()).isFalse();
        assertThat(retirarSub.getActivo()).isFalse();
        verify(tipificacionRepository, never()).delete(any());
        verify(subtipificacionRepository, never()).delete(any());
    }

    @Test
    void moverSubtipificacionDesactivaOrigenYCreaNuevaIdentidad() {
        Tipificacion origen = tipificacion(1L, "ORIGEN", 1, true);
        Tipificacion destino = tipificacion(2L, "DESTINO", 2, true);
        Subtipificacion movida = subtipificacion(10L, origen, "MOVIDA", 1, true);
        when(tipificacionRepository.findByEtapaOrderByOrdenAsc(Etapa.PREVENTA))
                .thenReturn(List.of(origen, destino));
        when(subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(List.of(origen, destino)))
                .thenReturn(List.of(movida));

        service.guardarMatrizCatalogo(matriz(
                tipRequest(1L, "ORIGEN", "Origen", List.of()),
                tipRequest(2L, "DESTINO", "Destino", List.of(
                        subRequest(10L, "MOVIDA", "Movida")
                ))
        ));

        assertThat(movida.getActivo()).isFalse();
        assertThat(movida.getTipificacion()).isSameAs(origen);

        verify(subtipificacionRepository).save(org.mockito.ArgumentMatchers.argThat(nueva ->
                nueva != movida
                        && nueva.getId() != null
                        && nueva.getTipificacion() == destino
                        && nueva.getCodigo().equals("MOVIDA")
                        && nueva.getOrden() == 1
                        && Boolean.TRUE.equals(nueva.getActivo())
        ));
    }

    @Test
    void matrizConSubtipificacionRepetidaSeRechazaAntesDePersistir() {
        SubtipificacionCatalogoRequest repetida = subRequest(10L, "REPETIDA", "Repetida");
        MatrizCatalogoRequest request = matriz(
                tipRequest(1L, "UNO", "Uno", List.of(repetida)),
                tipRequest(2L, "DOS", "Dos", List.of(repetida))
        );

        assertThatThrownBy(() -> service.guardarMatrizCatalogo(request))
                .isInstanceOf(BadRequestException.class);

        verify(tipificacionRepository, never()).save(any());
        verify(subtipificacionRepository, never()).save(any());
    }

    private MatrizCatalogoRequest matriz(TipificacionCatalogoRequest... tipificaciones) {
        return MatrizCatalogoRequest.builder()
                .etapa(Etapa.PREVENTA)
                .tipificaciones(List.of(tipificaciones))
                .build();
    }

    private TipificacionCatalogoRequest tipRequest(
            Long id,
            String codigo,
            String descripcion,
            List<SubtipificacionCatalogoRequest> subtipificaciones
    ) {
        return TipificacionCatalogoRequest.builder()
                .id(id)
                .codigo(codigo)
                .descripcion(descripcion)
                .orden(99)
                .subtipificaciones(subtipificaciones)
                .build();
    }

    private SubtipificacionCatalogoRequest subRequest(Long id, String codigo, String descripcion) {
        return SubtipificacionCatalogoRequest.builder()
                .id(id)
                .codigo(codigo)
                .descripcion(descripcion)
                .orden(99)
                .etapaCambio(Etapa.PREVENTA)
                .build();
    }

    private Tipificacion tipificacion(Long id, String codigo, int orden, boolean activo) {
        Tipificacion entity = new Tipificacion();
        entity.setId(id);
        entity.setEtapa(Etapa.PREVENTA);
        entity.setCodigo(codigo);
        entity.setDescripcion(codigo);
        entity.setOrden(orden);
        entity.setActivo(activo);
        return entity;
    }

    private Subtipificacion subtipificacion(
            Long id,
            Tipificacion padre,
            String codigo,
            int orden,
            boolean activo
    ) {
        Subtipificacion entity = new Subtipificacion();
        entity.setId(id);
        entity.setTipificacion(padre);
        entity.setCodigo(codigo);
        entity.setDescripcion(codigo);
        entity.setOrden(orden);
        entity.setEtapaCambio(Etapa.PREVENTA);
        entity.setActivo(activo);
        return entity;
    }
}
