import axios from 'axios';

// Create an Axios instance with the base URL
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    // Do not set a global Content-Type header here; allow the browser/axios
    // to set the correct header for FormData (multipart boundaries).
    headers: {},
});

// Request interceptor to attach the Authorization token
api.interceptors.request.use(
    (config) => {
        // Check if we are in the browser to access localStorage
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        // If payload is FormData, remove any Content-Type so the browser
        // can set the multipart boundary automatically.
        if (config && config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
            if (config.headers && config.headers['Content-Type']) {
                delete config.headers['Content-Type'];
            }
            // Axios may use lowercase header keys in some environments
            if (config.headers && config.headers['content-type']) {
                delete config.headers['content-type'];
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle unauthorized access (401)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Redirect to login page if authorized, but avoid infinite loops on /login
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                const role = localStorage.getItem('role');
                localStorage.removeItem('token'); // Clear invalid token
                localStorage.removeItem('role');
                document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

                if (role === 'admin') {
                    window.location.href = '/admin/login';
                } else {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
