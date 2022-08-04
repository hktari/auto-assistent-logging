import React, { useState } from 'react'

const Dashboard = () => {
    const [startBtnDisabled, setStartBtnDisabled] = useState(false)
    const [stopBtnDisabled, setStopBtnDisabled] = useState(true)

    function onStart(ev) {
        console.log('START CLICKED')
        setStartBtnDisabled(!startBtnDisabled);
        setStopBtnDisabled(!stopBtnDisabled);
    }

    function onStop(ev) {
        console.log('STOP CLICKED')
        setStartBtnDisabled(!startBtnDisabled);
        setStopBtnDisabled(!stopBtnDisabled);
    }


    return (
        <div>
            <button disabled={startBtnDisabled} className='t-Button--success' onClick={onStart}>START</button>
            <button disabled={stopBtnDisabled} className='t-Button--danger' onClick={onStop}>STOP</button>
        </div>
    )
}

export default Dashboard