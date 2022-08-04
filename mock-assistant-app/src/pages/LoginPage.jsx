import React from 'react'
import { useNavigate } from 'react-router-dom'

const LoginPage = () => {
    const navigate = useNavigate()

    function onSubmit(ev) {
        ev.preventDefault()
        console.log('submit');
        navigate('/dashboard')
    }
    
    return (
        <div>
            <form action="" method="post" onSubmit={onSubmit}>
                <label htmlFor="#P9999_USERNAME">Username</label>
                <input type="text" name="" id="#P9999_USERNAME" placeholder='username' />
                <label htmlFor="#P9999_PASSWORD">Password</label>
                <input type="password" name="" id="#P9999_PASSWORD" placeholder='password' />
                <button className='t-Login-buttons button' type="submit">Login</button>
            </form>
        </div>
    )
}

export default LoginPage