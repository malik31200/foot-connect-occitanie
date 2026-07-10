import axios from 'axios'

const client = axios.create({
    baseURL: 'https://1aae544cc2c4bae9-82-127-97-138.serveousercontent.com/api',
    timeout: 30000,
})

export default client
