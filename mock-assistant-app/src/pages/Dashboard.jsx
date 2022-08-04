import React, { useState } from 'react'
import api from '../services/api'
import { setCurAction, setUser } from '../features/userSlice'
import { useSelector, useDispatch } from 'react-redux'

const Dashboard = () => {
    const [sucessBannerVisible, setSucessBannerVisible] = useState(false)
    const user = useSelector((state) => state.user)
    const startBtnDisabled = useSelector((state) => state.user.cur_action === 'start_btn')
    const stopBtnDisabled = useSelector((state) => state.user.cur_action !== 'start_btn')

    const dispatch = useDispatch();

    async function onStart(ev) {
        console.log('START CLICKED')

        const userUpdate = await api.putUser({ ...user, cur_action: 'start_btn' })
        dispatch(setUser(userUpdate));

        console.log(userUpdate);

        setSucessBannerVisible(true);
        setTimeout(() => setSucessBannerVisible(false), 5000)
    }

    async function onStop(ev) {
        console.log('STOP CLICKED')

        const userUpdate = await api.putUser({ ...user, cur_action: 'stop_btn' })
        dispatch(setUser(userUpdate));
    }


    return (
        <div>
            <div>
                <p>
                    {user.username}
                </p>
                <p>
                    {user.cur_action}
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