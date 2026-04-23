import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
})

console.log('Axios baseURL:', import.meta.env.VITE_API_URL)

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    console.log('Request:', config.method, config.url, 'Token:', token ? 'exists' : 'missing')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.log('Axios error:', error.response?.status, error.response?.data)
        return Promise.reject(error);
    }
);

export default axiosInstance;