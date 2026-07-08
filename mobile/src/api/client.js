import axios from 'axios'

const client = axios.create({
    baseURL: 'https://b6901bcc65ff7d.lhr.life/api',
    timeout: 30000,
})

export default client
