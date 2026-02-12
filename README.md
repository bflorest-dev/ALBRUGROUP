# ALBRUGROUP - RRHH 👥

## 🎯 Propósito del Sistema

Sistema profesional para la gestion del personal de una empresa, pensado para un flujo de trabajo coordinado entre el area de recursos humanos y contabilidad. Centraliza la informacion del ciclo completo de personal (postulacion, contratacion y pago), y guarda datos estructurados para reportes y metricas operativas.

Este documento resume el flujo de negocio para **Postulantes**, **Empleados**, **Contratos** y **Pagos**. La documentacion tecnica y los endpoints estan disponibles en OpenAPI/Swagger.

## **Flujo general** 🔄

1. Un candidato se registra como **Postulante**.
2. El postulante queda asociado a un **Empleado** (registro maestro de la persona).
3. Cuando el postulante es contratado, se crea un **Contrato** y el empleado pasa a **Activo**.
4. Sobre cada contrato se registran los **Pagos**.

## **Postulantes** 👤

### 🧠 Logica de negocio:
- Al registrar un postulante, el sistema busca si ya existe un empleado con el mismo documento.
- Si no existe, crea el empleado y lo marca como **POSTULANTE**. En caso de existir, solo registra su postulacion usando sus datos previos.
- Luego crea la postulacion con estado **EN_PROCESO**.

### ⚠️ Consideraciones:
- Solo puede existir una postulacion **EN_PROCESO** por empleado.
- El cambio de estado se hace en bloque (varios postulantes a la vez) para facilitar los procesos de capacitacion de varios candidatos y solo si estan en **EN_PROCESO**.
- Se puede consultar postulantes filtrando por estado, puesto y rango de fechas.

### ✅ El sistema permite:
- Registrar postulantes.
- Actualizar datos de una postulacion.
- Cambiar el estado de postulacion a **APROBADO** o **RECHAZADO**.
- Consultar postulantes por filtros.

### ❌ El sistema no permite:
- Registrar otra postulacion **EN_PROCESO** si ya existe una vigente para el mismo empleado.
- Cambiar el estado de una postulacion que ya no esta **EN_PROCESO**.
- Actualizar o cambiar estado de un postulante inexistente.

## **Empleados** 🧑‍💼

### 🧠 Logica de negocio:
- El empleado es el registro base de la persona y puede crearse a partir de un postulante o de forma directa para ciertos puestos de trabajo considerados cargos de confianza.
- Al registrarse, el estado operativo inicia en **POSTULANTE**.
- Los datos del empleado se actualizan por bloques: personales, contacto/ubicacion, financieros y corporativos.
- Por defecto, los listados de empleados muestran solo **ACTIVOS** (salvo que se indique otro estado).

### ⚠️ Consideraciones:
- Documento, celular personal y correo personal son unicos.
- Para crear un contrato, el empleado debe tener datos personales, contacto, ubicacion y financieros completos.

### ✅ El sistema permite:
- Registrar empleados individualmente.
- Actualizar datos por bloques.
- Buscar por documento o por un dato general (busqueda universal).
- Listar empleados filtrando por estado, distrito y banco.

### ❌ El sistema no permite:
- Duplicar documento, celular o correo personal.
- Actualizar un empleado inexistente.

## **Contratos** 📝

### 🧠 Logica de negocio:
- Un contrato solo se puede registrar para un empleado existente y con datos completos.
- Al registrar un contrato, el empleado pasa a **ACTIVO**.
- Si existe un contrato vigente en la fecha de inicio del nuevo, se cierra automaticamente el dia anterior.
- No se permiten solapamientos de fechas entre contratos del mismo empleado.
- Al finalizar un contrato, el empleado pasa a **INACTIVO**.

### ⚠️ Consideraciones:
- Un contrato sin fecha fin se considera vigente hasta nuevo aviso.
- Si se intenta crear un contrato sin fecha fin y ya existen contratos futuros, se rechaza.

### ✅ El sistema permite:
- Registrar un contrato.
- Listar contratos por empleado.
- Consultar el contrato vigente.
- Finalizar un contrato.

### ❌ El sistema no permite:
- Registrar contratos con fechas que se solapan con otros del mismo empleado.
- Registrar contrato con empleado inexistente o con datos incompletos.
- Finalizar un contrato si el empleado no tiene uno vigente en la fecha indicada.

## **Pagos** 💸

### 🧠 Logica de negocio:
- Los pagos siempre pertenecen a un contrato.
El periodo de pago se determina segun estas reglas.
1. Sin fechas: se paga el mes completo actual.
2. Solo fecha de inicio: se paga desde esa fecha hasta fin de mes. Pensado para el primer pago de cada contrato.
3. Solo fecha de fin: se paga desde inicio de mes hasta esa fecha. Pensado para el ultimo pago de cada contrato.
4. Ambas fechas: se paga el periodo personalizado.
- El sueldo total se calcula sumando sueldo base del contrato + asignaciones/bonos/comisiones.

### ⚠️ Consideraciones:
- Las fechas del pago deben estar dentro del rango del contrato.
- La fecha fin nunca puede ser anterior a la fecha inicio.

### ✅ El sistema permite:
- Registrar pagos individualmente.
- Consultar pagos por contrato, empleado y rango de fechas.

### ❌ El sistema no permite:
- Registrar pagos fuera del rango del contrato.
- Registrar pagos con fecha fin menor a la fecha inicio.
- Registrar pagos para un contrato inexistente.

---

*Este sistema representa la base para una gestión moderna de recursos humanos, 
donde la información organizada se convierte en inteligencia de negocio.*
