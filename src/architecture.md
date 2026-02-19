# Arquitectura del Proyecto

## Reglas de Importación

- **Dominio (features) NO importa UI**: Los módulos de dominio (features) no deben importar componentes UI o Atomic Design. Mantener separación clara entre lógica de negocio y presentación.

- **UI importa Dominio**: Los componentes UI pueden importar tipos, servicios y lógica del dominio para consumir datos y funcionalidades.

- **Atomic Design solo para UI**: Atomic Design (atoms, molecules, organisms) se usa exclusivamente para componentes de interfaz de usuario. No mezclar con lógica de dominio.

- **Shared Types**: Interfaces globales como `User`, `Role` van en `shared/types`. Tipos específicos de feature van en `features/<role>/types.ts`.

## Estructura

- `src/features/<role>/`: Contiene types.ts, services.ts, components/ para cada rol.
- `src/components/`: Atomic Design para UI.
- `src/shared/types/`: Tipos globales.
- `src/dev/`: Herramientas de desarrollo como DevRoleSwitcher.

## Desarrollo

Usar DevRoleSwitcher para cambiar roles en desarrollo y visualizar interfaces sin login.