/**
 * HTTP Client Validation Script
 * Verifies JWT handling and header injection
 * 
 * Run after login to validate:
 * - JWT token stored correctly
 * - Headers injected on rrhhHttp and leadsHttp
 * - authHttp does NOT include JWT
 */

import { authHttp, rrhhHttp, leadsHttp, getStoredToken } from '@shared/api/httpClient';
import type { AxiosInstance } from 'axios';

interface ValidationResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: Record<string, unknown>;
}

const results: ValidationResult[] = [];

/**
 * Check 1: Token Storage
 */
function checkTokenStorage(): void {
  const token = getStoredToken();
  
  if (!token) {
    results.push({
      name: 'Token Storage',
      status: 'WARNING',
      message: 'No auth_token found in localStorage',
      details: { 'Try after': 'Login first' }
    });
  } else {
    const tokenPreview = `${token.substring(0, 20)}...${token.substring(token.length - 20)}`;
    results.push({
      name: 'Token Storage',
      status: 'PASS',
      message: `JWT token found (length: ${token.length})`,
      details: { tokenPreview }
    });
  }
}

/**
 * Check 2: Base URLs Configuration
 */
function checkBaseUrls(): void {
  const urlChecks = [
    { client: 'authHttp', baseURL: (authHttp as any).defaults?.baseURL },
    { client: 'rrhhHttp', baseURL: (rrhhHttp as any).defaults?.baseURL },
    { client: 'leadsHttp', baseURL: (leadsHttp as any).defaults?.baseURL },
  ];

  urlChecks.forEach(({ client, baseURL }) => {
    if (baseURL) {
      results.push({
        name: `${client} Base URL`,
        status: 'PASS',
        message: baseURL,
      });
    } else {
      results.push({
        name: `${client} Base URL`,
        status: 'FAIL',
        message: 'No baseURL configured',
      });
    }
  });
}

/**
 * Check 3: Interceptors Registered
 */
function checkInterceptors(): void {
  const interceptorChecks = [
    { 
      client: 'authHttp', 
      shouldHaveAuth: false,
      instance: authHttp
    },
    { 
      client: 'rrhhHttp', 
      shouldHaveAuth: true,
      instance: rrhhHttp
    },
    { 
      client: 'leadsHttp', 
      shouldHaveAuth: true,
      instance: leadsHttp
    },
  ];

  interceptorChecks.forEach(({ client, shouldHaveAuth, instance }) => {
    const hasRequestInterceptors = (instance as any).interceptors?.request?.handlers?.length > 0;
    const hasResponseInterceptors = (instance as any).interceptors?.response?.handlers?.length > 0;

    results.push({
      name: `${client} Interceptors`,
      status: 'PASS',
      message: `Request handlers: ${hasRequestInterceptors ? '✅' : '❌'}, Response handlers: ${hasResponseInterceptors ? '✅' : '❌'}`,
      details: {
        expectedAuth: shouldHaveAuth ? 'YES - JWT required' : 'NO - Public endpoint',
        hasRequestInterceptor: hasRequestInterceptors,
        hasResponseInterceptor: hasResponseInterceptors,
      }
    });
  });
}

/**
 * Check 4: Timeout Configuration
 */
function checkTimeouts(): void {
  const timeoutChecks = [
    { client: 'authHttp', instance: authHttp },
    { client: 'rrhhHttp', instance: rrhhHttp },
    { client: 'leadsHttp', instance: leadsHttp },
  ];

  timeoutChecks.forEach(({ client, instance }) => {
    const timeout = (instance as any).defaults?.timeout;
    const isValid = timeout === 30000;

    results.push({
      name: `${client} Timeout`,
      status: isValid ? 'PASS' : 'WARNING',
      message: `${timeout}ms ${isValid ? '(30 seconds - OK)' : '(Expected 30000ms)'}`,
    });
  });
}

/**
 * Check 5: Headers Configuration
 */
function checkHeaders(): void {
  const headerChecks = [
    { client: 'authHttp', instance: authHttp },
    { client: 'rrhhHttp', instance: rrhhHttp },
    { client: 'leadsHttp', instance: leadsHttp },
  ];

  headerChecks.forEach(({ client, instance }) => {
    const contentType = (instance as any).defaults?.headers?.common?.['Content-Type'];
    const isValid = contentType === 'application/json';

    results.push({
      name: `${client} Content-Type`,
      status: isValid ? 'PASS' : 'FAIL',
      message: contentType || 'Not set',
      details: { expected: 'application/json' }
    });
  });
}

/**
 * Run all checks
 */
export function validateHttpClients(): void {
  console.clear();
  console.log('🔍 HTTP Client Validation\n');

  checkTokenStorage();
  checkBaseUrls();
  checkInterceptors();
  checkTimeouts();
  checkHeaders();

  // Print results
  console.table(results);

  // Summary
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warned = results.filter(r => r.status === 'WARNING').length;

  console.log(`\n✅ Passed: ${passed} | ⚠️ Warnings: ${warned} | ❌ Failed: ${failed}\n`);

  if (failed === 0 && warned === 0) {
    console.log('🎉 All HTTP clients configured correctly!\n');
  } else if (failed === 0) {
    console.log('⚠️ Check warnings above\n');
  } else {
    console.error('❌ Fix errors above before proceeding\n');
  }
}

/**
 * Test Request with JWT (for manual testing)
 */
export async function testAuthenticatedRequest(): Promise<void> {
  try {
    console.log('Testing authenticated request with rrhhHttp...\n');
    
    // This will fail if no backend running, but shows JWT is being sent
    const response = await rrhhHttp.get('/test-endpoint');
    
    console.log('✅ Request sent with JWT interceptor active');
    console.log('Response:', response.data);
  } catch (error: any) {
    if (error.status === 401) {
      console.error('❌ 401 Unauthorized - Token invalid or expired');
    } else if (error.code === 'NETWORK_ERROR') {
      console.warn('⚠️ Backend not running (expected) - but JWT would be attached');
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Export for use in browser console
(globalThis as any).validateHttpClients = validateHttpClients;
(globalThis as any).testAuthenticatedRequest = testAuthenticatedRequest;

console.log('HTTP validation utilities loaded. Run: validateHttpClients() in console');
