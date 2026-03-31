package pe.albrugroup.lead_service.configuration;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.interceptor.SimpleCacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching @Slf4j
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {

        Duration catalogTtl = Duration.ofHours(12);

        ObjectMapper redisMapper = new ObjectMapper();
        redisMapper.registerModule(new JavaTimeModule());
        redisMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        redisMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer(redisMapper);
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(valueSerializer))
                .entryTtl(catalogTtl);

        Jackson2JsonRedisSerializer<CatalogoResponse> tipificacionesSerializer =
                new Jackson2JsonRedisSerializer<>(redisMapper, CatalogoResponse.class);
        RedisCacheConfiguration tipificacionesConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(tipificacionesSerializer)
        );

        Map<String, RedisCacheConfiguration> cacheConfigurations = Map.of(
                CacheNames.CAMPANAS, defaultConfig,
                CacheNames.PLANES, defaultConfig,
                CacheNames.TIPIFICACIONES, tipificacionesConfig,
                CacheNames.PROMOCIONES_COMERCIALES, defaultConfig,
                CacheNames.ADICIONALES, defaultConfig,
                CacheNames.PROVEEDORES, defaultConfig,
                CacheNames.CUENTAS_PUBLICITARIAS, defaultConfig,
                CacheNames.ZONAS, defaultConfig,
                CacheNames.UBIGEO, defaultConfig

        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public CacheErrorHandler cacheErrorHandler() {
        return new SimpleCacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache GET omitido en '{}' key '{}': {}", cacheName(cache), key, exception.getMessage());
            }
            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Cache PUT omitido en '{}' key '{}': {}", cacheName(cache), key, exception.getMessage());
            }
            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache EVICT omitido en '{}' key '{}': {}", cacheName(cache), key, exception.getMessage());
            }
            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Cache CLEAR omitido en '{}': {}", cacheName(cache), exception.getMessage());
            }
            private String cacheName(Cache cache) {
                return cache != null ? cache.getName() : "desconocida";
            }
        };
    }
}
