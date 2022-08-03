const assistantApp = require('./assistant-app')

let credentials = { username: 'bostjankamnik45', password: `zxA/)#]*'0.\`r:D;OxQH` }

async function run() {
    try {
        await assistantApp.addEntry(credentials);
        console.log('success');
    } catch (error) {
        console.error(error);
    }
}

run()
