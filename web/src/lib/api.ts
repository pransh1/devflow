import axios from "axios";


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});


// attach token to every request
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if(token) {
    config.headers.Authorization = `Bearer ${token}`;
  };
  return config;
});


// auto-refresh
api.interceptors.response.use((response) => response, 
  async (error) => {
    const originalRequest = error.config;

    if( error.response?.status === 401 && !originalRequest._retry ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken
        });
        const { accessToken } = res.data.data;
        localStorage.setItem('accessToken', accessToken)
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
  
      } catch {
        // refresh failed - log out
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error)
  }
);

export default api;