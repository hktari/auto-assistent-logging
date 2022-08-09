import React, { useState } from 'react'
import api from '../services/api'
import { setCurAction, setUser } from '../features/userSlice'
import { useSelector, useDispatch } from 'react-redux'
function LogEntry(action) {
    return {
        id: LogEntry.prototype.idCntr++,
        action: action,
        timestamp: new Date().toISOString()
    }
}
LogEntry.prototype.idCntr = 0;

const Dashboard = () => {
    const [sucessBannerVisible, setSucessBannerVisible] = useState(false)
    const user = useSelector((state) => state.user)
    const startBtnDisabled = useSelector((state) => state.user.action === 'start')
    const stopBtnDisabled = useSelector((state) => state.user.action !== 'start')

    const dispatch = useDispatch();


    async function onStart(ev) {
        console.log('START CLICKED')

        let userUpdate = { ...user, action: 'start' }
        userUpdate.logs.push(new LogEntry('start'))

        userUpdate = await api.putUser(userUpdate)
        dispatch(setUser(userUpdate));

        console.log(userUpdate);

        setSucessBannerVisible(true);
        setTimeout(() => setSucessBannerVisible(false), 5000)
    }

    async function onStop(ev) {
        console.log('STOP CLICKED')

        let userUpdate = { ...user, action: 'stop' }
        userUpdate.logs.push(new LogEntry('stop'))
        
        userUpdate = await api.putUser(userUpdate)
        dispatch(setUser(userUpdate));
    }


    return (
        <div>
            <div>
                <p>
                    {user.username}
                </p>
                <p>
                    {user.action}
                </p>
            </div>
            <div className="fos-Alert--success" style={sucessBannerVisible ? { display: 'block' } : { display: 'none' }}>
                <h2>Zapis uspešno dodan.</h2>
            </div>
            <button disabled={startBtnDisabled} className='t-Button--success' onClick={onStart}>START</button>
            <button disabled={stopBtnDisabled} className='t-Button--danger' onClick={onStop}>STOP</button>
        </div >
    )
}

export default Dashboard