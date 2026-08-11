import axios from 'axios'

const client = axios.create({
    baseURL: 'https://footconnect-occitanie.fr/api',
    timeout: 30000,
})

export default client
