import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

export function extractErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

export function extractErrorDetails(error) {
  return error?.response?.data?.error?.details ?? null;
}
