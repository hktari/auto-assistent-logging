if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    require('dotenv').config()
}


const puppeteer = require('puppeteer');
const { AUTOMATE_ACTION, LogEntry } = require('./interface');
const ENDPOINT = process.env.MDDSZ_WEBAPP_ENDPOINT
const logger = require('./util/logging')
const ExecuteFailureReason = Object.freeze({
    ButtonDisabled: 'ButtonDisabled'
})

class MDDSZApiError extends Error {
    constructor(action, failureReason, message) {
        super(message);
        this.action = action;
        this.failureReason = failureReason
    }

    toString() {
        return `${this.action}:(${this.failureReason})\t${this.message}`
    }
}

function delay(waitTime) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, waitTime);
    });

}

function createBrowser(debug) {
    if (debug) {
        return puppeteer.launch({
            // devtools: true
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            slowMo: 50,
        });
    } else {
        return puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            slowMo: 0,
        });

    }
}

async function executeAction(username, password, action) {
    logger.debug('endpoint: ' + ENDPOINT)
    logger.debug('Executing action: ' + action)
    logger.debug('ENV: ' + process.env.NODE_ENV)

    const VALID_ACTION = Object.entries(AUTOMATE_ACTION)
        .map(val => val[1])
        .includes(action);

    if (!VALID_ACTION) {
        throw new Error(`Unhandled type of action ${action}`);
    }

    const browser = await createBrowser(process.env.NODE_ENV === 'development')

    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(30000); // wait max 10 sec for things to appear

        await page.goto(ENDPOINT);
        await page.waitForNavigation(); // The promise resolves after navigation has finished

        const usernameInput = await page.waitForSelector('#P9999_USERNAME')
        await usernameInput.type(username)

        const pwdInput = await page.$('#P9999_PASSWORD');
        await pwdInput.type(password);

        logger.debug('logging in..');

        const loginBtn = await page.$('.t-Login-buttons button')
        await loginBtn.click()

        const openUserSelectionInput = await page.waitForSelector('input#P13_UPORABNIK_OA_SI_CI_ID')
        logger.debug('opening user selection...')

        await openUserSelectionInput.focus()
        await openUserSelectionInput.click()

        await delay(2000)


        const selectFirstRow = 'div.a-PopupLOV-results.a-GV > div.a-GV-bdy > div.a-GV-w-scroll > table > tbody > tr > td'
        await page.waitForSelector(selectFirstRow)
        const firstRow = await page.$(selectFirstRow)
        logger.debug(firstRow)
        logger.debug('selecting user...')
        // use evaluate instead of element.click
        // https://stackoverflow.com/questions/51857070/puppeteer-in-nodejs-reports-error-node-is-either-not-visible-or-not-an-htmlele
        await firstRow.evaluate(b => b.click())

        const startBtnSelector = 'button.t-Button--success';
        const stopBtnSelector = 'button.t-Button--danger';
        // make sure start button is enabled

        const btnSelector = action === AUTOMATE_ACTION.START_BTN ? startBtnSelector : stopBtnSelector;
        logger.debug('waiting for button...')
        const btn = await page.waitForSelector(btnSelector)

        await delay(3000)

        const buttonDisabled = await page.$eval(btnSelector, btn => btn.disabled);

        if (buttonDisabled) {
            throw new MDDSZApiError(action, ExecuteFailureReason.ButtonDisabled, `Can't click button: ${btnSelector}. \nDisabled`);
        }

        await btn.click()
        logger.debug('clicking...')

        // h2 Zapis uspe??no dodan.
        const successBannerSelector = ".fos-Alert--success"
        await page.waitForSelector(successBannerSelector)
        logger.debug('waiting for success banner...')

        await delay(5000);
        await browser.close();
        return "Finished successfully !"
    } catch (error) {
        logger.error(error.toString())
        throw error;
    }
    finally {
        await browser.close()
    }
}

const api = {
    executeAction,
    MDDSZApiError
}

module.exports = api
