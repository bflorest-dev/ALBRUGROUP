package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Contacto;
import pe.albrugroup.lead_service.entity.EquipoProveedor;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Origen;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.ContactoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceAlbIntakeTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private ContactoRepository contactoRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private LeadEtapaResumenService leadEtapaResumenService;
    @Mock private LeadMapper leadMapper;
    @Mock private CurrentUser currentUser;

    @InjectMocks private LeadService leadService;

    private final Origen origen = Origen.builder()
            .id(1L)
            .codigo("RECONTACTO")
            .nombre("Recontacto")
            .build();

    @Test
    void reencolaElLeadDelMismoProveedorYConservaSuIdentidad() {
        Proveedor claro = Proveedor.builder().id(1L).nombre("CLARO").activo(true).build();
        Lead existente = Lead.builder()
                .id(10L)
                .prefijo("+51")
                .lead("987654321")
                .proveedorOrigen(claro)
                .idEquipo(2L)
                .idAsesorAsignado(77L)
                .nombreAsesorAsignado("Asesora anterior")
                .idTipificacion(8L)
                .codigoTipificacion("CONTACTADO")
                .idSubtipificacion(9L)
                .codigoSubtipificacion("INTERESADO")
                .estado(EstadoSeguimiento.ASIGNADO)
                .etapa(Etapa.PREVENTA)
                .contacto(Contacto.builder().id(100L).prefijo("+51").lead("987654321").build())
                .build();
        LeadService.AlbIntakeContext contexto = new LeadService.AlbIntakeContext(6L, claro);

        when(leadRepository.buscarPorIdentidadParaCargaAlb("+51", "987654321"))
                .thenReturn(List.of(existente));
        when(leadRepository.save(existente)).thenReturn(existente);

        LeadService.AlbIntakeOutcome resultado = leadService.registrarIngresoLeadAlb(
                contexto,
                "+51",
                "987654321",
                origen,
                null,
                null,
                null,
                new java.util.ArrayList<>()
        );

        assertThat(resultado.operacion()).isEqualTo("REENCOLADO");
        assertThat(resultado.lead()).isSameAs(existente);
        assertThat(existente.getIdEquipo()).isEqualTo(6L);
        assertThat(existente.getProveedorOrigen()).isSameAs(claro);
        assertThat(existente.getIdAsesorAsignado()).isNull();
        assertThat(existente.getNombreAsesorAsignado()).isNull();
        assertThat(existente.getIdTipificacion()).isNull();
        assertThat(existente.getIdSubtipificacion()).isNull();
        assertThat(existente.getEstado()).isEqualTo(EstadoSeguimiento.NUEVO);
    }

    @Test
    void creaOtroLeadCuandoLaIdentidadExisteConOtroProveedor() {
        Proveedor claro = Proveedor.builder().id(1L).nombre("CLARO").activo(true).build();
        Proveedor win = Proveedor.builder().id(2L).nombre("WIN").activo(true).build();
        Lead existenteWin = Lead.builder()
                .id(10L)
                .prefijo("+51")
                .lead("987654321")
                .proveedorOrigen(win)
                .idEquipo(1L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.ASIGNADO)
                .build();
        Contacto contacto = Contacto.builder().id(100L).prefijo("+51").lead("987654321").build();
        Lead nuevoClaro = Lead.builder()
                .id(20L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();
        LeadService.AlbIntakeContext contexto = new LeadService.AlbIntakeContext(6L, claro);

        when(leadRepository.buscarPorIdentidadParaCargaAlb("+51", "987654321"))
                .thenReturn(List.of(existenteWin));
        when(leadMapper.toNuevoLead(
                eq("+51"),
                eq("987654321"),
                isNull(),
                eq(origen),
                isNull(),
                any()
        )).thenReturn(nuevoClaro);
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321"))
                .thenReturn(Optional.of(contacto));
        when(leadRepository.save(nuevoClaro)).thenReturn(nuevoClaro);

        LeadService.AlbIntakeOutcome resultado = leadService.registrarIngresoLeadAlb(
                contexto,
                "+51",
                "987654321",
                origen,
                null,
                null,
                null,
                new java.util.ArrayList<>()
        );

        assertThat(resultado.operacion()).isEqualTo("NUEVO_POR_PROVEEDOR");
        assertThat(resultado.lead()).isSameAs(nuevoClaro);
        assertThat(nuevoClaro.getIdEquipo()).isEqualTo(6L);
        assertThat(nuevoClaro.getProveedorOrigen()).isSameAs(claro);
        assertThat(nuevoClaro.getContacto()).isSameAs(contacto);
        assertThat(existenteWin.getIdEquipo()).isEqualTo(1L);
        assertThat(existenteWin.getProveedorOrigen()).isSameAs(win);
    }

    @Test
    void rechazaLaCargaSiElEquipoNoTieneProveedorFallback() {
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(6L));
        when(equipoProveedorRepository.findByIdEquipo(6L)).thenReturn(List.of());

        assertThatThrownBy(() -> leadService.prepararCargaAlb(6L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("proveedor fallback");
    }
}
