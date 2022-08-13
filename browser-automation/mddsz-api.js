const puppeteer = require('puppeteer');
const { AUTOMATE_ACTION } = require('./interface');
const ENDPOINT = process.env.MDDSZ_WEBAPP_ENDPOINT

const ExecuteFailureReason = Object.freeze({
    ButtonDisabled: 'ButtonDisabled'
})

class MDDSZApiError extends Error {
    constructor(action, failureReason, message) {
        super(message);
        this.action = action;
        this.failureReason = failureReason
    }
}

function delay(waitTime) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, waitTime);
    });

}

async function executeAction(username, password, action) {
    const VALID_ACTION = Object.entries(AUTOMATE_ACTION)
        .map(val => val[1])
        .includes(action);

    if (!VALID_ACTION) {
        throw new Error(`Unhandled type of action ${action}`);
    }

    console.debug('endpoint: ' + ENDPOINT)

    const isStartAction = action === AUTOMATE_ACTION.START_BTN
    console.debug('Executing start action: ', isStartAction)

    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // slowMo: 50, // slow down by 250ms
            // devtools: true
        }); // default is true

        const page = await browser.newPage();
        page.setDefaultTimeout(5000); // wait max 10 sec for things to appear

        await page.goto(ENDPOINT);
        await page.waitForNavigation(); // The promise resolves after navigation has finished

        const usernameInput = await page.waitForSelector('#P9999_USERNAME')
        await usernameInput.type(username)

        const pwdInput = await page.$('#P9999_PASSWORD');
        await pwdInput.type(password);

        console.log('logging in...')
        const loginBtn = await page.$('.t-Login-buttons button')
        loginBtn.click()

        const startBtnSelector = 'button.t-Button--success';
        const stopBtnSelector = 'button.t-Button--danger';
        // make sure start button is enabled

        console.log('wait for login...')

        const startBtn = await page.waitForSelector(startBtnSelector)

        const buttonDisabled = false;
        await page.$eval(isStartAction ? startBtnSelector : stopBtnSelector, btn => {
            if (btn.disabled) {
                buttonDisabled = true;
            }

            btn.click();
        })
        if (buttonDisabled) {
            throw new MDDSZApiError(action, ExecuteFailureReason.ButtonDisabled, `Can't click button: ${btn.className}. \nDisabled`);
        }

        // h2 Zapis uspešno dodan.
        const successBannerSelector = ".fos-Alert--success"
        await page.waitForSelector(successBannerSelector)

        // await page.screenshot({ path: 'example.png' });
        await browser.close();
        return "Finished successfully !"
    } catch (error) {
        console.error(error)
        throw error;
    }
}

module.exports.executeAction = executeAction
module.exports.MDDSZApiError = MDDSZApiError