/**
 * DEBUG: Test de autenticación para identificar el problema del token
 * 
 * Ejecutar en la consola del navegador:
 * 1. Abrir DevTools (F12)
 * 2. Ir a Console
 * 3. Copiar y pegar este código
 * 4. Ejecutar: debugAuthFlow()
 */

window.debugAuthFlow = async function() {
  console.group('🔍 DEBUG AUTH FLOW - Análisis Completo');
  
  // 1. Verificar localStorage
  console.log('📦 localStorage antes del test:', {
    auth_token: localStorage.getItem('auth_token'),
    auth_user: localStorage.getItem('auth_user'),
    user: localStorage.getItem('user'),
    allKeys: Object.keys(localStorage)
  });
  
  // 2. Limpiar localStorage completamente
  console.log('🧹 Limpiando localStorage...');
  localStorage.clear();
  
  // 3. Verificar que está limpio
  console.log('📦 localStorage después de limpiar:', {
    allKeys: Object.keys(localStorage),
    isEmpty: Object.keys(localStorage).length === 0
  });
  
  // 4. Test directo con fetch (sin axios)
  console.log('🧪 Test 1: Fetch directo (sin axios interceptors)');
  try {
    const fetchResponse = await fetch('/api/auth/autorizacion/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin@albru.admin.pe',
        password: 'albruadminpe'
      })
    });
    
    console.log('✅ Fetch directo - Status:', fetchResponse.status);
    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      console.log('✅ Fetch directo - Success:', {
        hasToken: !!data.token,
        username: data.username,
        roles: data.roles
      });
    } else {
      const errorText = await fetchResponse.text();
      console.error('❌ Fetch directo - Error:', {
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        body: errorText
      });
    }
  } catch (error) {
    console.error('❌ Fetch directo - Exception:', error);
  }
  
  // 5. Test con AuthRepository (axios + interceptors)
  console.log('🧪 Test 2: AuthRepository (con interceptors)');
  try {
    // Limpiar localStorage otra vez por si acaso
    localStorage.clear();
    
    // Importar AuthRepository dinámicamente
    const { AuthRepository } = await import('./src/shared/api/repositories/auth.repository.ts');
    
    const repoResponse = await AuthRepository.login({
      username: 'admin@albru.admin.pe',
      password: 'albruadminpe'
    });
    
    console.log('✅ AuthRepository - Success:', {
      hasToken: !!repoResponse.token,
      username: repoResponse.username,
      roles: repoResponse.roles
    });
    
  } catch (error) {
    console.error('❌ AuthRepository - Error:', {
      message: error.message,
      status: error.status,
      details: error.details
    });
  }
  
  console.groupEnd();
};

// Auto-ejecutar si se carga el script
console.log('🧪 DEBUG AUTH cargado. Ejecutar: debugAuthFlow()');