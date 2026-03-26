import axios from 'axios';

export const client = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api',
  timeout: 10000,
});
