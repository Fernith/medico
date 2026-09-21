import axios, { type AxiosRequestConfig } from 'axios';

// Create a central axios instance
export const apiClient = axios.create({
  baseURL: '/api', // Vite proxy will handle this
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for responses to handle errors globally if needed
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Polyfill function to replace `fetch` incrementally without breaking 50 files at once
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Strip '/api' from url since baseURL has it
  const cleanUrl = url.startsWith('/api') ? url.replace('/api', '') : url;
  
  const axiosConfig: AxiosRequestConfig = {
    method: options.method || 'GET',
    url: cleanUrl,
    headers: options.headers as Record<string, string>,
    data: options.body ? JSON.parse(options.body as string) : undefined,
  };

  try {
    const response = await apiClient.request(axiosConfig);
    // Create a fetch-like Response object
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
    } as Response;
  } catch (error: any) {
    if (error.response) {
      return {
        ok: false,
        status: error.response.status,
        json: async () => error.response.data,
        text: async () => JSON.stringify(error.response.data),
      } as Response;
    }
    throw error;
  }
};

