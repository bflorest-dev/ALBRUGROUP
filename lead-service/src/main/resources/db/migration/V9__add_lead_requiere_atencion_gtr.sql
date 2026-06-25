-- =====================================================================
-- Atención GTR de leads en otra etapa.
--
-- Cuando un contacto vuelve a comunicarse y su único lead ya no está en
-- PREVENTA, el GTR necesita poder registrarlo y verlo en su bandeja diaria
-- solo para asignarlo a un asesor que atienda la comunicación, sin alterar
-- la gestión del lead en su etapa actual. Este flag marca esos leads.
--
-- Idempotente. Flyway ejecuta el script dentro de una transacción.
-- =====================================================================

ALTER TABLE lead
    ADD COLUMN IF NOT EXISTS requiere_atencion_gtr boolean NOT NULL DEFAULT false;
