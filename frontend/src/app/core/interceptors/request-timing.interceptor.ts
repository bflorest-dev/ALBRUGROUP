import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';

export const requestTimingInterceptor: HttpInterceptorFn = (req, next) => {
  const startedAt = performance.now();
  const requestId = Math.random().toString(16).slice(2, 8);

  console.info(`[HTTP ${requestId}] -> ${req.method} ${req.urlWithParams}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          const elapsedMs = Math.round(performance.now() - startedAt);
          console.info(
            `[HTTP ${requestId}] <- ${event.status} ${req.method} ${req.urlWithParams} (${elapsedMs} ms)`
          );
        }
      },
      error: (error: unknown) => {
        const elapsedMs = Math.round(performance.now() - startedAt);
        const status = error instanceof HttpErrorResponse ? error.status : 'ERR';

        console.error(
          `[HTTP ${requestId}] !! ${status} ${req.method} ${req.urlWithParams} (${elapsedMs} ms)`,
          error
        );
      }
    })
  );
};
