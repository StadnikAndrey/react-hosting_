import axios from "axios";

const instance = axios.create({
    baseURL: '/api/',
    timeout: 10000,
    headers: { 'X-Custom-Header': 'foobar' }
});

export default instance;