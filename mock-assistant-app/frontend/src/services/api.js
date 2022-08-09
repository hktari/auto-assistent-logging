const endpoint = process.env.REACT_APP_BACKEND_ENDPOINT

console.debug("ENDPOINT:" + endpoint);

async function allUsers() {
    const result = await fetch(`${endpoint}/user`)
    if (result.ok) {
        return await result.json()
    } else {
        throw new Error('Failed to fetch users. Payload: ' + result.body)
    }
}

async function login(username, password) {
    const all = await allUsers();
    console.debug(JSON.stringify(all));
    const user = all.find(user => user.username === username)
    if (user && user.password === password) {
        return user;
    } else {
        // login failed
        return null;
    }
}

async function putUser(user) {
    const result = await fetch(`${endpoint}/user/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    })

    return await result.json();
}

const api = {
    allUsers,
    putUser,
    login
}
export default api;