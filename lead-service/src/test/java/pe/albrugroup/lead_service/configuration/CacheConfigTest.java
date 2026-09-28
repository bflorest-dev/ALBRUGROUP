package pe.albrugroup.lead_service.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import pe.albrugroup.lead_service.entity.response.OrigenResponse;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class CacheConfigTest {

    @Test
    void origenesCacheRecuperaElementosConSuTipo() {
        RedisCacheManager manager = new CacheConfig().cacheManager(mock(RedisConnectionFactory.class));
        manager.afterPropertiesSet();
        RedisCacheConfiguration configuration = manager.getCacheConfigurations().get(CacheNames.ORIGENES);
        assertThat(configuration).isNotNull();

        List<OrigenResponse> origenes = List.of(
                new OrigenResponse(1L, "WHATSAPP", "WhatsApp", true, true)
        );
        var serialization = configuration.getValueSerializationPair();
        Object restored = serialization.read(serialization.write(origenes));

        assertThat(restored).isInstanceOf(List.class);
        assertThat(restored).isEqualTo(origenes);
        assertThat(((List<?>) restored).get(0)).isInstanceOf(OrigenResponse.class);
    }
}
