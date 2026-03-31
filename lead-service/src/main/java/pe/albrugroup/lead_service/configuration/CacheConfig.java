package pe.albrugroup.lead_service.configuration;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JavaType;
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
import pe.albrugroup.lead_service.entity.response.AdicionalResponse;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
import pe.albrugroup.lead_service.entity.response.CatalogoResponse;
import pe.albrugroup.lead_service.entity.response.CuentaPublicitariaResponse;
import pe.albrugroup.lead_service.entity.response.DepartamentoResponse;
import pe.albrugroup.lead_service.entity.response.DistritoResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.entity.response.PromocionComercialResponse;
import pe.albrugroup.lead_service.entity.response.ProveedorResponse;
import pe.albrugroup.lead_service.entity.response.ProvinciaResponse;
import pe.albrugroup.lead_service.entity.response.ServiciosProveedorResponse;
import pe.albrugroup.lead_service.entity.response.ZonaResponse;

import java.time.Duration;
import java.util.List;
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

        RedisCacheConfiguration serviciosProveedorConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        new Jackson2JsonRedisSerializer<>(redisMapper, ServiciosProveedorResponse.class)
                )
        );
        RedisCacheConfiguration planesConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, PlanResponse.class)
                )
        );
        RedisCacheConfiguration adicionalesConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, AdicionalResponse.class)
                )
        );
        RedisCacheConfiguration promocionesConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, PromocionComercialResponse.class)
                )
        );
        RedisCacheConfiguration campanasConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, CampanaResponse.class)
                )
        );
        RedisCacheConfiguration proveedoresConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, ProveedorResponse.class)
                )
        );
        RedisCacheConfiguration cuentasPublicitariasConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, CuentaPublicitariaResponse.class)
                )
        );
        RedisCacheConfiguration zonasConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, ZonaResponse.class)
                )
        );
        RedisCacheConfiguration departamentosConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, DepartamentoResponse.class)
                )
        );
        RedisCacheConfiguration provinciasConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, ProvinciaResponse.class)
                )
        );
        RedisCacheConfiguration distritosConfig = defaultConfig.serializeValuesWith(
                RedisSerializationContext.SerializationPair.fromSerializer(
                        listSerializer(redisMapper, DistritoResponse.class)
                )
        );

        Map<String, RedisCacheConfiguration> cacheConfigurations = Map.ofEntries(
                Map.entry(CacheNames.CAMPANAS, campanasConfig),
                Map.entry(CacheNames.PLANES, planesConfig),
                Map.entry(CacheNames.SERVICIOS_PROVEEDOR, serviciosProveedorConfig),
                Map.entry(CacheNames.TIPIFICACIONES, tipificacionesConfig),
                Map.entry(CacheNames.PROMOCIONES_COMERCIALES, promocionesConfig),
                Map.entry(CacheNames.ADICIONALES, adicionalesConfig),
                Map.entry(CacheNames.PROVEEDORES, proveedoresConfig),
                Map.entry(CacheNames.CUENTAS_PUBLICITARIAS, cuentasPublicitariasConfig),
                Map.entry(CacheNames.ZONAS, zonasConfig),
                Map.entry(CacheNames.UBIGEO_DEPARTAMENTOS, departamentosConfig),
                Map.entry(CacheNames.UBIGEO_PROVINCIAS, provinciasConfig),
                Map.entry(CacheNames.UBIGEO_DISTRITOS, distritosConfig)
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

    private <T> Jackson2JsonRedisSerializer<List<T>> listSerializer(ObjectMapper redisMapper, Class<T> elementType) {
        JavaType listType = redisMapper.getTypeFactory().constructCollectionType(List.class, elementType);
        return new Jackson2JsonRedisSerializer<>(redisMapper, listType);
    }
}
