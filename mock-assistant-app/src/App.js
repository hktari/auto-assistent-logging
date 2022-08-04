import './App.css';

import LoginPage from './pages/LoginPage';
import { Route, BrowserRouter, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { useNavigate } from 'react-router-dom'
import api from './services/api'
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setUser } from './features/userSlice'

function App() {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  async function onLogin(username, password) {
    const user = await api.login(username, password)

    dispatch(setUser(user))

    if (user) {
      console.log('login OK', user);
      navigate('/dashboard')
    }
    else {
      console.log('login failed')
      window.alert('login failed')
    }
  }
  return (
    <>
      <Routes>
        <Route path='/' element={<LoginPage onLogin={onLogin} />} />
        <Route path='/dashboard' element={<Dashboard />} />
      </Routes>
    </>
  );
}

export default App;
