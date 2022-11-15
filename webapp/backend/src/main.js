require('dotenv').config();

const app = require('./aal-server')


app.listen(process.env.PORT, () => {
    console.log(`Listening on port ${process.env.PORT}`)
})