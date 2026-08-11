import axios from 'axios'

const client = axios.create({
    baseURL: 'https://85512299b7965a3e-82-127-97-138.serveousercontent.com/api',
    timeout: 30000,
})

export default client
