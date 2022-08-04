import React, { useState } from 'react'

const Dashboard = () => {
    const [startBtnDisabled, setStartBtnDisabled] = useState(false)
    const [stopBtnDisabled, setStopBtnDisabled] = useState(true)
    const [sucessBannerVisible, setSucessBannerVisible] = useState(false)

    function onStart(ev) {
        console.log('START CLICKED')
        setStartBtnDisabled(!startBtnDisabled);
        setStopBtnDisabled(!stopBtnDisabled);
        setSucessBannerVisible(true);
        setTimeout(() => setSucessBannerVisible(false), 5000)
    }

    function onStop(ev) {
        console.log('STOP CLICKED')
        setStartBtnDisabled(!startBtnDisabled);
        setStopBtnDisabled(!stopBtnDisabled);
    }


    return (
        <div>
            <div className="fos-Alert--success" style={sucessBannerVisible ? {display: 'block'} : {display: 'none'}}>
                <h2>Zapis uspešno dodan.</h2>
            </div>
            <button disabled={startBtnDisabled} className='t-Button--success' onClick={onStart}>START</button>
            <button disabled={stopBtnDisabled} className='t-Button--danger' onClick={onStop}>STOP</button>
        </div>
    )
}

export default Dashboard