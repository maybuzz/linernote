const express    = require('express')
const app        = express()
const bodyParser = require('body-parser')
const path       = require('path')
const session    = require('express-session')
const routes     = require('./modules/routes')
const port       = process.env.PORT || 3000
const http       = require('http').Server(app)
const oauth      = require('./modules/oauth')
const io         = require('socket.io')(http)

app
    .set('view engine', 'ejs')
    .set('views', path.join(__dirname, '../src/views'))
    .set('socketio', io)
    .use(express.static(path.join(__dirname, '../src/static')))
    .use(session({
        secret: 'Linernote',
        cookie: {secure:false},
        resave: false,
        saveUninitialized: true
    }))
    .use(bodyParser.urlencoded({ extended: false }))
    .use(bodyParser.json())
    .use(oauth)
    .use('/', routes)
    .use(express.static('static'))


http.listen(port, ()=>console.log(`Server is listening to port ${port}`))
