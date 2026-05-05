import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/storage.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.accessToken);
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.accessToken, token);
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEYS.accessToken);
  }
}
