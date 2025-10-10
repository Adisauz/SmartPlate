import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE = 'http://192.168.0.6:8000';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 60 seconds timeout (for AI image generation)
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    (config.headers as any) = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  // If uploading FormData, let Axios set the multipart boundary automatically
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if ((config.headers as any) && (config.headers as any)['Content-Type']) {
      delete (config.headers as any)['Content-Type'];
    }
  } else {
    // Default to JSON for non-FormData requests
    (config.headers as any) = config.headers || {};
    (config.headers as any)['Accept'] = 'application/json';
  }
  return config;
});

export default api; 