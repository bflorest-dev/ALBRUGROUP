package pe.albrugroup.lead_service.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import pe.albrugroup.lead_service.entity.Internet;
import pe.albrugroup.lead_service.entity.Plan;
import pe.albrugroup.lead_service.entity.PromocionComercial;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Telefono;
import pe.albrugroup.lead_service.entity.Television;
import pe.albrugroup.lead_service.entity.Zona;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false"
})
class PlanRepositoryOfertaTest {

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private PromocionComercialRepository promocionComercialRepository;

    @Autowired
    private TestEntityManager entityManager;

    private Proveedor proveedor;
    private Zona zona;
    private Plan planInternetTv;
    private Plan planTriple;
    private Plan planInternetTvOtraZona;

    @BeforeEach
    void setUp() {
        proveedor = Proveedor.builder()
                .nombre("Proveedor test")
                .activo(true)
                .build();
        zona = Zona.builder()
                .nombre("Zona test")
                .proveedor(proveedor)
                .activo(true)
                .build();

        entityManager.persist(proveedor);
        entityManager.persist(zona);
    }

    @Test
    void filtraComposicionExactaYPromocionInterna() {
        Internet internet = Internet.builder()
                .velocidad(300)
                .unidad(Unidad.MBPS)
                .tecnologia(Tecnologia.FTTH)
                .proveedor(proveedor)
                .activo(true)
                .build();
        Television television = Television.builder()
                .nombre("TV test")
                .cantidadCanales(80)
                .proveedor(proveedor)
                .activo(true)
                .build();
        Internet internetTriple = Internet.builder()
                .velocidad(600)
                .unidad(Unidad.MBPS)
                .tecnologia(Tecnologia.FTTH)
                .proveedor(proveedor)
                .activo(true)
                .build();
        Telefono telefono = Telefono.builder()
                .minutos(500)
                .descripcion("Telefonia test")
                .proveedor(proveedor)
                .activo(true)
                .build();

        entityManager.persist(internet);
        entityManager.persist(television);
        entityManager.persist(internetTriple);
        entityManager.persist(telefono);
        entityManager.flush();

        planInternetTv = planRepository.save(Plan.builder()
                .proveedor(proveedor)
                .zona(zona)
                .nombre("Internet TV")
                .precio(new BigDecimal("79.90"))
                .precioPromocional(new BigDecimal("69.90"))
                .mesesPromocionPrecio(3)
                .vigenciaDesde(LocalDate.now().minusDays(1))
                .internet(internet)
                .television(television)
                .activo(true)
                .build());
        planTriple = planRepository.save(Plan.builder()
                .proveedor(proveedor)
                .zona(zona)
                .nombre("Triple")
                .precio(new BigDecimal("99.90"))
                .vigenciaDesde(LocalDate.now().minusDays(1))
                .internet(internetTriple)
                .television(television)
                .telefono(telefono)
                .activo(true)
                .build());

        Zona otraZona = Zona.builder()
                .nombre("Zona provincia test")
                .proveedor(proveedor)
                .activo(true)
                .build();
        entityManager.persist(otraZona);
        planInternetTvOtraZona = planRepository.save(Plan.builder()
                .proveedor(proveedor)
                .zona(otraZona)
                .nombre("Internet TV provincia")
                .precio(new BigDecimal("74.90"))
                .precioPromocional(new BigDecimal("64.90"))
                .mesesPromocionPrecio(3)
                .vigenciaDesde(LocalDate.now().minusDays(1))
                .internet(internet)
                .television(television)
                .activo(true)
                .build());

        promocionComercialRepository.save(PromocionComercial.builder()
                .reglaComercial("PROMO PLAN")
                .proveedor(proveedor)
                .zona(zona)
                .planes(new HashSet<>(List.of(planInternetTv)))
                .activo(true)
                .build());

        promocionComercialRepository.save(PromocionComercial.builder()
                .reglaComercial("PROMO GLOBAL")
                .proveedor(proveedor)
                .zona(null)
                .planes(new HashSet<>())
                .activo(true)
                .build());

        entityManagerFlush();

        List<Plan> planes = planRepository.buscarParaOferta(
                proveedor.getId(),
                zona.getId(),
                false,
                true,
                null,
                true,
                "INTERNET_TV",
                LocalDate.now()
        );

        assertThat(planes).extracting(Plan::getId).containsExactly(planInternetTv.getId());

        List<Plan> triplesConPromo = planRepository.buscarParaOferta(
                proveedor.getId(),
                zona.getId(),
                false,
                false,
                null,
                true,
                "INTERNET_TV_TELEFONIA",
                LocalDate.now()
        );

        assertThat(triplesConPromo).extracting(Plan::getId).containsExactly(planTriple.getId());

        List<Plan> planesSinZona = planRepository.buscarParaOferta(
                proveedor.getId(),
                zona.getId(),
                true,
                true,
                null,
                true,
                "INTERNET_TV",
                LocalDate.now()
        );

        assertThat(planesSinZona).extracting(Plan::getId)
                .containsExactly(planInternetTv.getId(), planInternetTvOtraZona.getId());
    }

    private void entityManagerFlush() {
        entityManager.flush();
    }
}
