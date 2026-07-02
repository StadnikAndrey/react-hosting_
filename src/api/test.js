import http from '@/api/http.js';

export async function getJPH() {
    // await sleep(5000);
    return await http.get('https://jsonplaceholder.typicode.com/posts/1')
        .catch(function (error) {
            console.log(error);
        })
}

async function sleep(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}