import axios from 'axios'

const client = axios.create({
    baseURL: 'https://0539c6653431b4.lhr.life/api',
    timeout: 10000,
})

export default client
