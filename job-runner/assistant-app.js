const puppeteer = require('puppeteer');

function delay(waitTime) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, waitTime);
    });

}

function addEntry({ username, password, start }) {

    return new Promise((res, rej) => {
        (async () => {
            const browser = await puppeteer.launch({
                headless: false,
                slowMo: 50, // slow down by 250ms
                // devtools: true
            }); // default is true

            try {
                const page = await browser.newPage();
                await page.goto('https://mddsz.si/oa/oa_web_ws/r/osebna_asistenca');
                await page.waitForNavigation(); // The promise resolves after navigation has finished

                const usernameInput = await page.$('#P9999_USERNAME')
                await usernameInput.type(username)

                const pwdInput = await page.$('#P9999_PASSWORD');
                await pwdInput.type(password);

                const loginBtn = await page.$('.t-Login-buttons button')
                loginBtn.click()

                const startBtnSelector = 'button.t-Button--success';
                const stopBtnSelector = 'button.t-Button--danger';
                // make sure start button is enabled

                const startBtn = await page.waitForSelector(startBtnSelector) // wait 30 sec for login
                await delay(3000);

                console.log('start btn disabled:', await page.$eval(startBtnSelector, btn => btn.disabled))
                console.log('stop btn disabled:', await page.$eval(stopBtnSelector, btn => btn.disabled))
                // await startBtn.click();

                // await page.screenshot({ path: 'example.png' });
                await browser.close();
                res(true)
            } catch (error) {
                rej(error)
            }
        })();
    })
}

const assistantApp = {
    addEntry
}

module.exports = assistantApp