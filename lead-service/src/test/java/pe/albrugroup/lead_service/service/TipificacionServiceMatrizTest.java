package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.MatrizTipificacion;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.FlujoMatrizTipificacion;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.MatrizCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.SubtipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionCatalogoRequest;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.SubtipificacionResponse;
import pe.albrugroup.lead_service.entity.response.TipificacionResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.MatrizTipificacionRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.repository.FlujoMatrizTipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TipificacionServiceMatrizTest {

    private static final Long PROVEEDOR = 1L;
    private static final Long PROVEEDOR_B = 2L;

    @Mock private TipificacionRepository tipificacionRepository;
    @Mock private SubtipificacionRepository subtipificacionRepository;
    @Mock private MatrizTipificacionRepository matrizTipificacionRepository;
    @Mock private FlujoMatrizTipificacionRepository flujoMatrizTipificacionRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private TipificacionMapper mapper;

    private TipificacionService service;
    private final AtomicLong tipificacionId = new AtomicLong(100);
    private final AtomicLong subtipificacionId = new AtomicLong(200);
    private MatrizTipificacion matrizProveedor;
    private MatrizTipificacion matrizProveedorB;

    @BeforeEach
    void setUp() {
        matrizProveedor = matrizCabecera(10L, PROVEEDOR);
        matrizProveedorB = matrizCabecera(20L, PROVEEDOR_B);
        service = new TipificacionService(
                tipificacionRepository,
                subtipificacionRepository,
                matrizTipificacionRepository,
                flujoMatrizTipificacionRepository,
                proveedorRepository,
                mapper
        );
        lenient().when(matrizTipificacionRepository.findByEtapaAndProveedorId(Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(Optional.of(matrizProveedor));
        lenient().when(matrizTipificacionRepository.findByEtapaAndProveedorId(Etapa.PREVENTA, PROVEEDOR_B))
                .thenReturn(Optional.of(matrizProveedorB));
        lenient().when(matrizTipificacionRepository.findByEtapaAndProveedorIdAndActivoTrue(Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(Optional.of(matrizProveedor));
        lenient().when(matrizTipificacionRepository.findByEtapaAndProveedorIdAndActivoTrue(Etapa.PREVENTA, PROVEEDOR_B))
                .thenReturn(Optional.of(matrizProveedorB));
        lenient().when(flujoMatrizTipificacionRepository.findByMatrizIdAndActivoTrue(any()))
                .thenReturn(List.of());
        lenient().when(flujoMatrizTipificacionRepository.save(any(FlujoMatrizTipificacion.class))).thenAnswer(invocation -> invocation.getArgument(0));
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
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
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
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
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
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
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
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
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

        verify(subtipificacionRepository).save(argThat(nueva ->
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

    @Test
    void catalogoVacioCuandoElProveedorNoTieneMatriz() {
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdAndActivoTrueOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR_B))
                .thenReturn(List.of());

        CatalogoResponse catalogo = service.getCatalogo(Etapa.PREVENTA, PROVEEDOR_B);

        assertThat(catalogo.getTipificaciones()).isEmpty();
    }

    @Test
    void catalogoOperativoSoloDevuelveTipificacionesSeleccionables() {
        Tipificacion visible = tipificacion(1L, "VISIBLE", 1, true);
        Tipificacion ocultoPorFlujo = tipificacion(2L, "OCULTO", 2, true);
        visible.setSeleccionableManual(Boolean.TRUE);
        ocultoPorFlujo.setSeleccionableManual(Boolean.TRUE);
        FlujoMatrizTipificacion flujo = flujo(null, visible);
        when(flujoMatrizTipificacionRepository.findByMatrizIdAndTipificacionOrigenIsNullAndActivoTrue(10L))
                .thenReturn(List.of(flujo));
        when(tipificacionRepository
                .findByMatrizEtapaAndMatrizProveedorIdAndSeleccionableManualTrueAndActivoTrueOrderByOrdenAsc(
                        Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(List.of(visible, ocultoPorFlujo));
        when(subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(List.of(visible)))
                .thenReturn(List.of());
        when(mapper.toResponse(eq(visible), anyList())).thenReturn(TipificacionResponse.builder()
                .id(1L)
                .codigo("VISIBLE")
                .descripcion("Visible")
                .orden(1)
                .seleccionableManual(true)
                .subtipificaciones(List.of())
                .build());

        CatalogoResponse catalogo = service.getCatalogoOperativo(Etapa.PREVENTA, PROVEEDOR, null);

        assertThat(catalogo.getTipificaciones()).extracting(TipificacionResponse::getCodigo)
                .containsExactly("VISIBLE");
        verify(tipificacionRepository)
                .findByMatrizEtapaAndMatrizProveedorIdAndSeleccionableManualTrueAndActivoTrueOrderByOrdenAsc(
                        Etapa.PREVENTA, PROVEEDOR);
    }

    @Test
    void validarTipificacionPermitidaRechazaDestinoFueraDelFlujo() {
        Tipificacion origen = tipificacion(1L, "ORIGEN", 1, true);
        Tipificacion destinoPermitido = tipificacion(2L, "PERMITIDO", 2, true);
        Tipificacion destinoBloqueado = tipificacion(3L, "BLOQUEADO", 3, true);
        destinoPermitido.setSeleccionableManual(Boolean.TRUE);
        destinoBloqueado.setSeleccionableManual(Boolean.TRUE);
        when(flujoMatrizTipificacionRepository.findByMatrizIdAndTipificacionOrigenIdAndActivoTrue(10L, 1L))
                .thenReturn(List.of(flujo(origen, destinoPermitido)));

        assertThatThrownBy(() -> service.validarTipificacionPermitida(
                Etapa.PREVENTA,
                PROVEEDOR,
                origen.getId(),
                destinoBloqueado
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("estado actual");
    }

    @Test
    void guardarMatrizPersisteSeleccionableManualYConversion() {
        Tipificacion origen = tipificacion(1L, "SIN_INGRESOS", 1, true);
        Tipificacion destino = tipificacion(2L, "NO_GESTIONABLE", 2, true);
        Subtipificacion origenSub = subtipificacion(10L, origen, "SIN_CTO", 1, true);
        Subtipificacion destinoSub = subtipificacion(20L, destino, "SIN_CTO", 1, true);
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(List.of(origen, destino));
        when(subtipificacionRepository.findByTipificacionInOrderByTipificacion_IdAscOrdenAsc(List.of(origen, destino)))
                .thenReturn(List.of(origenSub, destinoSub));
        when(tipificacionRepository.findById(2L)).thenReturn(Optional.of(destino));
        when(subtipificacionRepository.findById(20L)).thenReturn(Optional.of(destinoSub));

        SubtipificacionCatalogoRequest subOrigen = subRequest(10L, "SIN_CTO", "Sin CTO");
        subOrigen.setTipificacionConversionId(2L);
        subOrigen.setSubtipificacionConversionId(20L);
        TipificacionCatalogoRequest tipDestino = tipRequest(2L, "NO_GESTIONABLE", "No gestionable", List.of(
                subRequest(20L, "SIN_CTO", "Sin CTO")
        ));
        tipDestino.setSeleccionableManual(Boolean.FALSE);

        service.guardarMatrizCatalogo(matriz(
                tipRequest(1L, "SIN_INGRESOS", "Sin ingresos", List.of(subOrigen)),
                tipDestino
        ));

        assertThat(destino.getSeleccionableManual()).isFalse();
        assertThat(origenSub.getTipificacionConversion()).isSameAs(destino);
        assertThat(origenSub.getSubtipificacionConversion()).isSameAs(destinoSub);
    }

    @Test
    void guardarMatrizRechazaConversionIncompleta() {
        SubtipificacionCatalogoRequest sub = subRequest(10L, "SIN_CTO", "Sin CTO");
        sub.setTipificacionConversionId(2L);

        assertThatThrownBy(() -> service.guardarMatrizCatalogo(matriz(
                tipRequest(1L, "SIN_INGRESOS", "Sin ingresos", List.of(sub))
        ))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("conversion");

        verify(tipificacionRepository, never()).save(any());
        verify(subtipificacionRepository, never()).save(any());
    }

    @Test
    void guardarMatrizSellaElProveedorYSoloLeeLaMatrizDeEseProveedor() {
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(List.of());

        service.guardarMatrizCatalogo(matriz(
                tipRequest(null, "NUEVA", "Nueva", List.of())
        ));

        // El archivado solo mira la matriz de este proveedor: nunca lee por etapa sola.
        verify(tipificacionRepository).findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR);
        verify(tipificacionRepository).save(argThat(t ->
                "NUEVA".equals(t.getCodigo()) && PROVEEDOR.equals(t.getMatriz().getProveedor().getId())));
    }

    @Test
    void clonarMatrizCopiaLaMatrizDelOrigenAlDestino() {
        Tipificacion origenTip = tipificacion(1L, "BASE", 1, true);
        Subtipificacion origenSub = subtipificacion(10L, origenTip, "BASE_SUB", 1, true);
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdAndActivoTrueOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(List.of(origenTip));
        when(subtipificacionRepository
                .findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(List.of(origenTip)))
                .thenReturn(List.of(origenSub));

        // getCatalogo(origen) arma las responses con el mapper (mock): las reconstruimos para la copia.
        SubtipificacionResponse subResp = SubtipificacionResponse.builder()
                .id(10L).codigo("BASE_SUB").descripcion("BASE_SUB").orden(1).etapaCambio(Etapa.PREVENTA).build();
        when(mapper.toResponse(origenSub)).thenReturn(subResp);
        when(mapper.toResponse(eq(origenTip), anyList())).thenReturn(TipificacionResponse.builder()
                .id(1L).codigo("BASE").descripcion("BASE").orden(1)
                .subtipificaciones(List.of(subResp)).build());

        // El destino aún no tiene matriz en esta etapa.
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR_B))
                .thenReturn(List.of());

        service.clonarMatriz(Etapa.PREVENTA, PROVEEDOR, PROVEEDOR_B);

        verify(tipificacionRepository).save(argThat(t ->
                "BASE".equals(t.getCodigo()) && PROVEEDOR_B.equals(t.getMatriz().getProveedor().getId())));
        verify(subtipificacionRepository).save(argThat(s ->
                "BASE_SUB".equals(s.getCodigo())
                        && s.getTipificacion() != null
                        && PROVEEDOR_B.equals(s.getTipificacion().getMatriz().getProveedor().getId())));
    }

    @Test
    void guardarMatrizPersisteLosComportamientosDeLaSubtipi() {
        when(tipificacionRepository.findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa.PREVENTA, PROVEEDOR))
                .thenReturn(List.of());

        SubtipificacionCatalogoRequest sub = SubtipificacionCatalogoRequest.builder()
                .codigo("VENTA_CERRADA").descripcion("Venta cerrada").orden(1)
                .etapaCambio(Etapa.VENTA)
                .comportamientos(new java.util.HashSet<>(java.util.Set.of(
                        ComportamientoTipificacion.ES_CIERRE_PREVENTA, ComportamientoTipificacion.ASIGNA_ASESOR_MERITO)))
                .build();

        service.guardarMatrizCatalogo(matriz(
                tipRequest(null, "PREVENTA_COMPLETA", "Completa", List.of(sub))
        ));

        verify(subtipificacionRepository).save(argThat(s ->
                "VENTA_CERRADA".equals(s.getCodigo())
                        && s.getComportamientos().contains(ComportamientoTipificacion.ES_CIERRE_PREVENTA)
                        && s.getComportamientos().contains(ComportamientoTipificacion.ASIGNA_ASESOR_MERITO)));
    }

    @Test
    void rechazaComportamientosContradictoriosDeMerito() {
        SubtipificacionCatalogoRequest asesorContradictorio = SubtipificacionCatalogoRequest.builder()
                .codigo("ASESOR_CONFLICTO").descripcion("Asesor conflicto").orden(1)
                .etapaCambio(Etapa.PREVENTA)
                .comportamientos(new java.util.HashSet<>(java.util.Set.of(
                        ComportamientoTipificacion.ASIGNA_ASESOR_MERITO,
                        ComportamientoTipificacion.ANULA_ASESOR_MERITO)))
                .build();

        assertThatThrownBy(() -> service.guardarMatrizCatalogo(matriz(
                tipRequest(null, "PREVENTA", "Preventa", List.of(asesorContradictorio))
        ))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("asesor de merito");

        SubtipificacionCatalogoRequest fechaContradictoria = SubtipificacionCatalogoRequest.builder()
                .codigo("FECHA_CONFLICTO").descripcion("Fecha conflicto").orden(1)
                .etapaCambio(Etapa.PREVENTA)
                .comportamientos(new java.util.HashSet<>(java.util.Set.of(
                        ComportamientoTipificacion.ASIGNA_FECHA_MERITO,
                        ComportamientoTipificacion.ANULA_FECHA_MERITO)))
                .build();

        assertThatThrownBy(() -> service.guardarMatrizCatalogo(matriz(
                tipRequest(null, "PREVENTA", "Preventa", List.of(fechaContradictoria))
        ))).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fecha de merito");

        verify(tipificacionRepository, never()).save(any());
        verify(subtipificacionRepository, never()).save(any());
    }

    private MatrizCatalogoRequest matriz(TipificacionCatalogoRequest... tipificaciones) {
        return MatrizCatalogoRequest.builder()
                .etapa(Etapa.PREVENTA)
                .idProveedor(PROVEEDOR)
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
        entity.setMatriz(matrizProveedor);
        entity.setCodigo(codigo);
        entity.setDescripcion(codigo);
        entity.setOrden(orden);
        entity.setSeleccionableManual(Boolean.TRUE);
        entity.setActivo(activo);
        return entity;
    }

    private FlujoMatrizTipificacion flujo(Tipificacion origen, Tipificacion destino) {
        FlujoMatrizTipificacion flujo = new FlujoMatrizTipificacion();
        flujo.setMatriz(matrizProveedor);
        flujo.setTipificacionOrigen(origen);
        flujo.setTipificacionDestino(destino);
        flujo.setActivo(Boolean.TRUE);
        return flujo;
    }

    private MatrizTipificacion matrizCabecera(Long id, Long idProveedor) {
        Proveedor proveedor = Proveedor.builder().id(idProveedor).nombre("Proveedor " + idProveedor).activo(true).build();
        MatrizTipificacion matriz = new MatrizTipificacion();
        matriz.setId(id);
        matriz.setEtapa(Etapa.PREVENTA);
        matriz.setProveedor(proveedor);
        matriz.setActivo(Boolean.TRUE);
        return matriz;
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
