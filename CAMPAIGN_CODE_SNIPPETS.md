# 💻 Snippets de Código y Ejemplos

## 1. Cómo usar el módulo Campañas

### Integración en PaginaCommunity (ya hecha ✅)

```tsx
// src/caracteristicas/community/pages/PaginaCommunity.tsx

import { CampaignSection } from '../ui/CampaignSection';

export const PaginaCommunity: React.FC = () => {
  // ... otros estados

  const sectionStyle = { /* estilos */ };

  return (
    <div className="container-fluid p-4">
      <h1>Panel Community</h1>
      
      {/* ... navbar buttons ... */}

      {/* Usar CampaignSection directamente */}
      {activeSection === 'campanas' && <CampaignSection sectionStyle={sectionStyle} />}

      {/* ... otras secciones ... */}
    </div>
  );
};
```

---

## 2. Extender el servicio (agregar nuevos endpoints)

### Ejemplo: Agregar GET /campanas (listar campañas)

```typescript
// src/shared/services/campaignService.ts

/**
 * Obtener todas las campañas
 */
export const fetchCampanas = async (): Promise<Campaign[]> => {
  try {
    const token = localStorage.getItem('auth_token');
    console.debug('[CampaignService] GET campanas', 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');
    
    const res = await leadsHttp.get(normalizeLeadsPath('/api/leads/campanas'));
    return res.data ?? [];
  } catch (err: any) {
    const status = err.status || err.response?.status || 0;
    console.error('[CampaignService] Error fetching campanas:', { status, message: err.message });
    throw new Error(`Error al cargar campañas (${status}): ${err.message}`);
  }
};

/**
 * Actualizar una campaña (PATCH)
 */
export const updateCampaign = async (id: string, payload: Partial<CreateCampaignPayload>): Promise<Campaign> => {
  try {
    const token = localStorage.getItem('auth_token');
    console.debug('[CampaignService] PATCH campanas/' + id, 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');
    
    const res = await leadsHttp.patch(normalizeLeadsPath(`/api/leads/campanas/${id}`), payload);
    return res.data ?? {};
  } catch (err: any) {
    const status = err.status || err.response?.status || 0;
    console.error('[CampaignService] Error updating campaign:', { status, message: err.message });
    throw new Error(`Error al actualizar campaña (${status}): ${err.message}`);
  }
};

/**
 * Eliminar una campaña (DELETE)
 */
export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('auth_token');
    console.debug('[CampaignService] DELETE campanas/' + id, 'Authorization:', token ? 'Bearer *****' : 'NO TOKEN');
    
    await leadsHttp.delete(normalizeLeadsPath(`/api/leads/campanas/${id}`));
  } catch (err: any) {
    const status = err.status || err.response?.status || 0;
    console.error('[CampaignService] Error deleting campaign:', { status, message: err.message });
    throw new Error(`Error al eliminar campaña (${status}): ${err.message}`);
  }
};
```

---

## 3. Tests unitarios (Vitest) 

### Test del Hook useCampaignForm

```typescript
// src/caracteristicas/community/hooks/useCampaignForm.test.ts

import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCampaignForm } from './useCampaignForm';
import * as campaignService from '@shared/services/campaignService';

vi.mock('@shared/services/campaignService');

describe('useCampaignForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load cuentas and proveedores on mount', async () => {
    const mockCuentas = [{ id: '1', numeroCuenta: '123', nombreCuenta: 'Google Ads' }];
    const mockProveedores = [{ id: 'p1', nombre: 'Agency A' }];

    vi.mocked(campaignService.fetchCuentasPublicitarias).mockResolvedValue(mockCuentas);
    vi.mocked(campaignService.fetchProveedores).mockResolvedValue(mockProveedores);

    const TestComponent = () => {
      const { cuentas, proveedores, loading } = useCampaignForm();
      return (
        <div>
          {loading ? <p>Loading...</p> : <p>Loaded</p>}
          <p>Cuentas: {cuentas.length}</p>
          <p>Proveedores: {proveedores.length}</p>
        </div>
      );
    };

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
      expect(screen.getByText('Cuentas: 1')).toBeInTheDocument();
      expect(screen.getByText('Proveedores: 1')).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    const TestComponent = () => {
      const { formState, handleSubmit, errors } = useCampaignForm();
      return (
        <div>
          <button onClick={handleSubmit}>Submit</button>
          {errors.nombre && <p>{errors.nombre}</p>}
        </div>
      );
    };

    render(<TestComponent />);
    
    const submitBtn = screen.getByText('Submit');
    submitBtn.click();

    await waitFor(() => {
      expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
    });
  });

  it('should prevent double-click submission', async () => {
    vi.mocked(campaignService.createCampaign).mockResolvedValue({});

    const TestComponent = () => {
      const { handleSubmit, submitting } = useCampaignForm();
      return (
        <div>
          <button onClick={handleSubmit} disabled={submitting}>
            Submit {submitting && '(submitting)'}
          </button>
        </div>
      );
    };

    render(<TestComponent />);
    
    const submitBtn = screen.getByText(/Submit/);
    expect(submitBtn.textContent).toBe('Submit');
    
    // Simular 2 clicks rápidos
    submitBtn.click();
    submitBtn.click();

    // Debería haber solo una llamada a createCampaign
    await waitFor(() => {
      expect(campaignService.createCampaign).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Test del Componente FormCampaign

```typescript
// src/caracteristicas/community/ui/FormCampaign.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormCampaign } from './FormCampaign';
import type { CampaignFormState } from '../hooks/useCampaignForm';

describe('FormCampaign', () => {
  const mockFormState: CampaignFormState = {
    nombre: 'Test Campaign',
    numeroWhatsapp: '+57 310...',
    cuentasIds: ['1', '2'],
    proveedoresIds: ['p1'],
  };

  const mockProps = {
    formState: mockFormState,
    onInputChange: vi.fn(),
    onCuentasChange: vi.fn(),
    onProveedoresChange: vi.fn(),
    onSubmit: vi.fn(),
    cuentas: [
      { id: '1', numeroCuenta: '123', nombreCuenta: 'Google Ads' },
      { id: '2', numeroCuenta: '456', nombreCuenta: 'Facebook' },
    ],
    proveedores: [{ id: 'p1', nombre: 'Agency A' }],
    loading: false,
    submitting: false,
    errors: {},
    globalMessage: '',
  };

  it('should render all input fields', () => {
    render(<FormCampaign {...mockProps} />);

    expect(screen.getByDisplayValue('Test Campaign')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+57 310...')).toBeInTheDocument();
    expect(screen.getByText('Nombre *')).toBeInTheDocument();
    expect(screen.getByText('Número WhatsApp *')).toBeInTheDocument();
  });

  it('should call onInputChange when typing in nombre field', () => {
    render(<FormCampaign {...mockProps} />);

    const nombreInput = screen.getByDisplayValue('Test Campaign');
    fireEvent.change(nombreInput, { target: { value: 'New Campaign' } });

    expect(mockProps.onInputChange).toHaveBeenCalledWith('nombre', 'New Campaign');
  });

  it('should display error messages from errors prop', () => {
    const errorProps = {
      ...mockProps,
      errors: { nombre: 'El nombre es requerido' },
    };

    render(<FormCampaign {...errorProps} />);

    expect(screen.getByText('El nombre es requerido')).toBeInTheDocument();
  });

  it('should disable button when submitting', () => {
    const submittingProps = {
      ...mockProps,
      submitting: true,
    };

    render(<FormCampaign {...submittingProps} />);

    const submitBtn = screen.getByText('⏳ Creando campaña...');
    expect(submitBtn).toBeDisabled();
  });

  it('should show global message alert', () => {
    const alertProps = {
      ...mockProps,
      globalMessage: '✅ Campaña creada exitosamente',
    };

    render(<FormCampaign {...alertProps} />);

    expect(screen.getByText('✅ Campaña creada exitosamente')).toBeInTheDocument();
  });
});
```

### Test del Servicio campaignService

```typescript
// src/shared/services/campaignService.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leadsHttp } from '@shared/api/clienteHttp';
import { fetchCuentasPublicitarias, fetchProveedores, createCampaign } from './campaignService';

vi.mock('@shared/api/clienteHttp');

describe('campaignService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'mock-token');
  });

  it('should fetch cuentas publicitarias', async () => {
    const mockData = [
      { id: '1', numeroCuenta: '123', nombreCuenta: 'Google Ads' },
      { id: '2', numeroCuenta: '456', nombreCuenta: 'Facebook' },
    ];

    vi.mocked(leadsHttp.get).mockResolvedValue({ data: mockData, error: false, status: 200 });

    const result = await fetchCuentasPublicitarias();

    expect(result).toEqual(mockData);
    expect(leadsHttp.get).toHaveBeenCalledWith('/cuentas-publicitarias');
  });

  it('should create campaign with correct payload', async () => {
    const mockPayload = {
      nombre: 'Test Campaign',
      numeroWhatsapp: '+57 310...',
      cuentas: ['1', '2'],
      proveedores: ['p1'],
    };

    const mockResponse = { id: 'campaign-123', ...mockPayload };

    vi.mocked(leadsHttp.post).mockResolvedValue({ data: mockResponse, error: false, status: 201 });

    const result = await createCampaign(mockPayload);

    expect(result).toEqual(mockResponse);
    expect(leadsHttp.post).toHaveBeenCalledWith('/campanas', mockPayload);
  });

  it('should handle 401 error', async () => {
    const mockError = {
      status: 401,
      response: { status: 401, data: { message: 'Unauthorized' } },
      message: 'Unauthorized',
    };

    vi.mocked(leadsHttp.post).mockRejectedValue(mockError);

    await expect(createCampaign({} as any)).rejects.toThrow('Error al crear campaña (401)');
  });

  it('should handle timeout with auto-retry', async () => {
    // Primer intento falla con timeout
    vi.mocked(leadsHttp.post).mockRejectedValueOnce({
      code: 'ECONNABORTED',
      config: { _retry: false },
      message: 'Timeout',
    });

    // Segundo intento (retry) funciona
    vi.mocked(leadsHttp.post).mockResolvedValueOnce({
      data: { id: 'campaign-123' },
      error: false,
      status: 201,
    });

    // El retry es manejado por el interceptor, así que aquí solo testeamos que el error se propague
    const mockError = {
      code: 'ECONNABORTED',
      config: { _retry: false },
      message: 'Timeout',
    };

    vi.mocked(leadsHttp.post).mockRejectedValueOnce(mockError);

    await expect(createCampaign({} as any)).rejects.toThrow('Error al crear campaña');
  });
});
```

---

## 4. Agregar Refetch después de crear

### Opción A: Agregar tabla de campañas (si existe GET endpoint)

```typescript
// src/caracteristicas/community/ui/CampaignSection.tsx

import { useState, useEffect } from 'react';
import { fetchCampanas } from '@shared/services/campaignService';
import type { Campaign } from '@entidades/campana';

interface CampaignSectionProps {
  sectionStyle?: React.CSSProperties;
}

export const CampaignSection: React.FC<CampaignSectionProps> = ({ sectionStyle = {...} }) => {
  const {
    formState,
    handleInputChange,
    handleCuentasChange,
    handleProveedoresChange,
    handleSubmit,
    cuentas,
    proveedores,
    loading,
    submitting,
    errors,
    globalMessage,
  } = useCampaignForm();

  // Cargar tabla de campañas
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await fetchCampanas();
      setCampaigns(data);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  // Refetch después de crear
  const handleSubmitWithRefetch = async () => {
    await handleSubmit();
    // Después de 1 segundo, refetch la lista
    setTimeout(() => loadCampaigns(), 1000);
  };

  return (
    <section style={sectionStyle}>
      <h2>Campañas</h2>
      
      <FormCampaign
        formState={formState}
        onInputChange={handleInputChange}
        onCuentasChange={handleCuentasChange}
        onProveedoresChange={handleProveedoresChange}
        onSubmit={handleSubmitWithRefetch}  // ← Updated
        cuentas={cuentas}
        proveedores={proveedores}
        loading={loading}
        submitting={submitting}
        errors={errors}
        globalMessage={globalMessage}
      />

      {/* Tabla de campañas */}
      <div style={{ marginTop: 32 }}>
        <h3>Campañas Creadas ({campaigns.length})</h3>
        {loadingCampaigns && <p>Cargando...</p>}
        {campaigns.length === 0 && !loadingCampaigns && <p>Sin campañas aún</p>}
        {campaigns.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Nombre</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>WhatsApp</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Cuentas</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Proveedores</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{campaign.nombre}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{campaign.numeroWhatsapp}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{campaign.cuentas.length}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{campaign.proveedores.length}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>
                    <button onClick={() => console.log('Edit:', campaign.id)}>✏️ Editar</button>
                    <button onClick={() => console.log('Delete:', campaign.id)}>🗑️ Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};
```

---

## 5. ErrorBoundary Global (Bonus)

```typescript
// src/shared/ui/ErrorBoundary.tsx

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              background: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: 4,
              padding: 16,
              margin: 16,
              color: '#721c24',
            }}
          >
            <h3>⚠️ Algo salió mal</h3>
            <p>{this.state.error?.message || 'Error desconocido'}</p>
            <button onClick={() => window.location.reload()}>🔄 Recargar página</button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Uso en PaginaCommunity:
// <ErrorBoundary>
//   <CampaignSection sectionStyle={sectionStyle} />
// </ErrorBoundary>
```

---

## 6. Logging Estructurado (Advanced)

```typescript
// src/shared/lib/logger.ts

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  timestamp: string;
  data?: any;
}

export class Logger {
  static log(level: LogLevel, source: string, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      source,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    console[level.toLowerCase() as keyof typeof console](
      `[${entry.timestamp}] [${source}] ${message}`,
      data || ''
    );

    // Aquí podrías enviar a un servicio de logging (Sentry, LogRocket, etc.)
  }

  static debug(source: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, source, message, data);
  }

  static error(source: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, source, message, data);
  }
}

// Uso:
// Logger.debug('CampaignService', 'Fetching cuentas...', { endpoint: '/api/leads/cuentas-publicitarias' });
// Logger.error('CampaignService', 'Failed to create campaign', { status: 500, error });
```

---

**Última actualización**: 2026-03-28 | **Versión**: 1.0
