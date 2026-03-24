export * from './esquemas';
export { DocumentSchema, NewEmployeeFormDataSchema, NewApplicantFormDataSchema, NewApplicantFormDataSchema as newApplicantFormDataSchema, type NewEmployeeFormDataType, type NewApplicantFormDataType } from './esquemas';

// Re-exportar esquemas desde src/validation si existen
export * from '../../validation/schemas';
