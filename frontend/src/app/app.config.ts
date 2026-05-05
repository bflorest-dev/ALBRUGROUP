import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { BrowserSessionService } from './core/services/browser-session.service';

function initializeBrowserSession(browserSessionService: BrowserSessionService): () => void {
  return () => browserSessionService.initialize();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      multi: true,
      deps: [BrowserSessionService],
      useFactory: initializeBrowserSession
    }
  ]
};
