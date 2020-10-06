const cmd = require("child_process")
const spawn = cmd.spawn;

const path = require('path')
const express = require('express')
const socket = require('socket.io')
const fs = require('fs');
const { parse } = require("path");
const app = express()

const logFilePath = './logs/log.log'
const port = 8080
// const shell = spawn('adb,',['shell'])



const server = app.listen(port, ()=>{
    console.log(`listening on port ${port}`)
})

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

const io = socket(server)

io.on('connection', (socket) =>{
    console.log('user connected!')

    socket.on('startLogcat',() => {
        console.log('logcat should start now')
        startLogcat(socket)
    })
    socket.on('screenCap', () => {
        startScreenCap(socket)
    })
    socket.on('logToFile', (parsedData) => {
        startLogToFile(socket, parsedData)
    })
    socket.on('clearLog', ()=>{
        fs.writeFileSync(logFilePath, '', function(){ console.log('logCleared') })
    })
})


function startLogcat(socket) {
    const logcat = spawn("adb", ["logcat", '-s', 'VrApi'])
    
    logcat.stdout.on("data", data => {
        socket.emit('res', `${data}`)
    })
    
    logcat.stderr.on("data", data => {
        socket.emit('res', `${data}`)
    })
    
    logcat.on('error', (error) => {
        console.log(`error: ${error.message}`)
    })
    
    logcat.on("close", code => {
        console.log(`child process exited with code ${code}`)
    })
}

function startScreenCap(socket) {
    
    const screenDevicePath = './sdcard/screencap.png'

    const screenCap = cmd.spawnSync('adb', ['shell',
     'screencap','-p',
     screenDevicePath])
    
    socket.emit('screenCapRes', screenCap.stdout)
    pullFromSD(screenDevicePath, socket)

}
function pullFromSD(where, socket){
    const pull = spawn('adb', ['pull', where])
    pull.stdout.on('data', data =>{
        console.log(`${data}`)
        socket.emit('screenCapRes', `${data}`)
    })
    
    pull.stderr.on('data', data =>{
        console.log(`${data}`)
        socket.emit('screenCapRes', `${data}`)
    })
}
function startLogToFile (socket, parsedData) {
    if(fs.existsSync(logFilePath)){
        fs.appendFile(logFilePath, parsedData +'\n', err =>{
            if(err){
                console.error(err)
                return
            }
        })
    }else{
        fs.writeFile(logFilePath, parsedData +'\n', err =>{
            if(err){
                console.error(err)
                return
            }
        })
    }
}