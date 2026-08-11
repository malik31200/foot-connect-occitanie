import axios from 'axios'

const client = axios.create({
    baseURL: 'http://95.217.154.83/api',
    timeout: 30000,
})

export default client
