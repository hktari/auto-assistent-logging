import React, { useState } from 'react'

const LoginPage = ({onLogin}) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')

    function onSubmit(ev) {
        ev.preventDefault()
        console.log('submit');
        onLogin(username, password)
    }

    return (
        <div>
            <form action="" method="post" onSubmit={onSubmit}>
                <label htmlFor="P9999_USERNAME">Username</label>
                <input onChange={ev => setUsername(ev.currentTarget.value)} value={username}
                    type="text" name="" id="P9999_USERNAME" placeholder='username' />

                <label htmlFor="P9999_PASSWORD">Password</label>
                <input onChange={ev => setPassword(ev.currentTarget.value)} value={password}
                    type="password" name="" id="P9999_PASSWORD" placeholder='password' />
                <div className="t-Login-buttons">
                    <button type="submit">Login</button>
                </div>
            </form>
        </div>
    )
}

export default LoginPage