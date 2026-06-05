import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

const client = axios.create({
    baseURL: API_URL,
})

// Automatically adds the JWT token to each request
client.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default client
