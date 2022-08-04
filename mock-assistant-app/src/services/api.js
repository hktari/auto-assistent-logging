const endpoint = "http://localhost:5983"

async function allUsers() {
    const result = await fetch(`${endpoint}/user`)
    return await result.json()
}

async function login(username, password) {
    const all = await allUsers();
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