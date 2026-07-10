import axios from 'axios'

const client = axios.create({
    baseURL: 'https://dcb86a1c276b884f-82-127-97-138.serveousercontent.com/api',
    timeout: 30000,
})

export default client
