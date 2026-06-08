# Patron seguro para filtros de fecha opcionales

## Problema a evitar

Evitar consultas JPQL/SQL con parametros de fecha opcionales usando este patron:

```java
@Query("""
    SELECT e
    FROM Evento e
    WHERE e.idLead = :idLead
      AND (:fechaDesde IS NULL OR e.createdAt >= :fechaDesde)
      AND (:fechaHasta IS NULL OR e.createdAt < :fechaHasta)
    """)
```

En PostgreSQL, cuando `fechaDesde` o `fechaHasta` llegan como `null`, Hibernate puede generar
un parametro sin tipo SQL inferible. El error usual en runtime es:

```text
ERROR: could not determine data type of parameter
```

Esto termina exponiendose como `500 Internal Server Error`.

## Regla

No usar condiciones `:param IS NULL OR campo >= :param` para filtros de fecha opcionales.

Cuando un endpoint permita `fechaDesde` y `fechaHasta` opcionales, separar la consulta por caso:

- Sin fechas.
- Solo `fechaDesde`.
- Solo `fechaHasta`.
- `fechaDesde` y `fechaHasta`.

## Patron recomendado

Crear metodos derivados o queries explicitas por cada combinacion necesaria:

```java
Page<Evento> findByIdLeadOrderByCreatedAtDesc(Long idLead, Pageable pageable);

Page<Evento> findByIdLeadAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
        Long idLead,
        Instant fechaDesde,
        Pageable pageable
);

Page<Evento> findByIdLeadAndCreatedAtLessThanOrderByCreatedAtDesc(
        Long idLead,
        Instant fechaHasta,
        Pageable pageable
);

Page<Evento> findByIdLeadAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
        Long idLead,
        Instant fechaDesde,
        Instant fechaHasta,
        Pageable pageable
);
```

Y resolver la seleccion en el service:

```java
if (fechaDesde != null && fechaHasta != null) {
    return repository.findByIdLeadAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            idLead,
            fechaDesde,
            fechaHasta,
            pageable
    );
}
if (fechaDesde != null) {
    return repository.findByIdLeadAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(idLead, fechaDesde, pageable);
}
if (fechaHasta != null) {
    return repository.findByIdLeadAndCreatedAtLessThanOrderByCreatedAtDesc(idLead, fechaHasta, pageable);
}
return repository.findByIdLeadOrderByCreatedAtDesc(idLead, pageable);
```

## Notas de negocio

- Para rangos por dia, convertir `LocalDate` a `Instant` antes de consultar.
- Usar rango semiabierto: `createdAt >= fechaDesde` y `createdAt < fechaHasta`.
- Si `fechaHasta` representa un dia seleccionado por el usuario, convertirlo al inicio del dia siguiente.
- Mantener el orden y paginado en todos los metodos equivalentes.

## Checklist antes de cerrar un endpoint con fechas opcionales

- El endpoint funciona sin enviar fechas.
- El endpoint funciona solo con `fechaDesde`.
- El endpoint funciona solo con `fechaHasta`.
- El endpoint funciona con ambas fechas.
- `mvn compile` pasa.
- Si hay contenedor Docker en uso, se reconstruyo y reinicio el servicio que contiene el cambio.
