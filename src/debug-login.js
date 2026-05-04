/**
 * DEBUG: Test de login para comparar con Postman
 * 
 * Ejecutar en la consola del navegador:
 * 1. Abrir DevTools (F12)
 * 2. Ir a Console
 * 3. Copiar y pegar este código
 * 4. Ejecutar: testLogin('admin@albru.admin.pe', 'TU_PASSWORD')
 */

window.testLogin = async function(username, password) {
  console.group('🧪 DEBUG LOGIN TEST');
  
  try {
    // Test 1: Fetch directo (sin axios)
    console.log('📤 Test 1: Fetch directo al backend');
    const fetchResponse = await fetch('http://localhost:8080/autorizacion/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('✅ Fetch directo - Status:', fetchResponse.status);
    if (fetchResponse.ok) {
      const data = await fetchResponse.json();
      console.log('✅ Fetch directo - Response:', data);
    } else {
      const error = await fetchResponse.text();
      console.error('❌ Fetch directo - Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Fetch directo - Exception:', error);
  }
  
  try {
    // Test 2: Fetch a través del proxy de Vite
    console.log('📤 Test 2: Fetch a través del proxy');
    const proxyResponse = await fetch('/api/auth/autorizacion/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    console.log('✅ Proxy - Status:', proxyResponse.status);
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log('✅ Proxy - Response:', data);
    } else {
      const error = await proxyResponse.text();
      console.error('❌ Proxy - Error:', error);
    }
    
  } catch (error) {
    console.error('❌ Proxy - Exception:', error);
  }
  
  try {
    // Test 3: AuthRepository (como lo usa la app)
    console.log('📤 Test 3: AuthRepository');
    const { AuthRepository } = await import('./src/shared/api/repositories/auth.repository.ts');
    const repoResponse = await AuthRepository.login({ username, password });
    console.log('✅ AuthRepository - Response:', repoResponse);
    
  } catch (error) {
    console.error('❌ AuthRepository - Error:', error);
  }
  
  console.groupEnd();
};

console.log('🧪 DEBUG LOGIN cargado. Usar: testLogin("admin@albru.admin.pe", "password")');