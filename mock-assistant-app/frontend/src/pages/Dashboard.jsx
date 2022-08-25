import React, { useState } from 'react'
import api from '../services/api'
import { setCurAction, setUser } from '../features/userSlice'
import { useSelector, useDispatch } from 'react-redux'

import uuid from 'react-uuid'
function LogEntry(action) {
    return {
        id: uuid(),
        action: action,
        timestamp: new Date().toISOString()
    }
}

const Dashboard = () => {
    const [sucessBannerVisible, setSucessBannerVisible] = useState(false)
    const user = useSelector((state) => state.user)

    const [selectedUser, setSelectedUser] = useState('')

    const [startBtnVisible, setStartBtnVisible] = useState(false)
    const startBtnDisabled = useSelector((state) => state.user.action === 'start')

    const [stopBtnVisible, setStopBtnVisible] = useState(false)
    const stopBtnDisabled = useSelector((state) => state.user.action !== 'start')

    const [openUserSelector, setOpenUserSelector] = useState(false)

    const dispatch = useDispatch();


    async function onStart(ev) {
        console.log('START CLICKED')

        let userUpdate = { ...user, action: 'start' }
        userUpdate.logs = [...userUpdate.logs, new LogEntry('start')]

        userUpdate = await api.putUser(userUpdate)
        dispatch(setUser(userUpdate));

        console.log(userUpdate);

        setSucessBannerVisible(true);
        setTimeout(() => setSucessBannerVisible(false), 5000)
    }

    async function onStop(ev) {
        console.log('STOP CLICKED')

        let userUpdate = { ...user, action: 'stop' }
        userUpdate.logs = [...userUpdate.logs, new LogEntry('stop')]

        userUpdate = await api.putUser(userUpdate)
        dispatch(setUser(userUpdate));
    }


    function onOpenUserSelection() {
        setOpenUserSelector(true)
    }

    function onUserSelected(user) {
        setOpenUserSelector(false)
        setStartBtnVisible(true)
        setStopBtnVisible(true)
        setSelectedUser(user)
    }
    return (
        <div style={{padding: '50px'}}>
            <div className="">
                <label htmlFor='P13_UPORABNIK_OA_SI_CI_ID'>Select user</label>
                <input type="" id="P13_UPORABNIK_OA_SI_CI_ID" value={selectedUser} onClick={() => onOpenUserSelection()} />

                <div id="#PopupLov_13_P13_UPORABNIK_OA_SI_CI_ID_dlg" hidden={!openUserSelector}>
                    <div className="a-PopupLOV-results a-GV">
                        <div className="a-GV-bdy">
                            <div className="a-GV-w-scroll">
                                <table>
                                    <tbody>
                                        <tr onClick={() => onUserSelected('USER')}>
                                            USER
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr />
            <hr />
            <hr />

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
            <button disabled={startBtnDisabled} className='t-Button--success' hidden={!startBtnVisible} onClick={onStart}>START</button>
            <button disabled={stopBtnDisabled} className='t-Button--danger' hidden={!stopBtnVisible} onClick={onStop}>STOP</button>
        </div >
    )
}

export default Dashboard