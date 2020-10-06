const FPSOutput = document.querySelector('#FPS')
const StaleOutput = document.querySelector('#Stale')
const TearsOutput = document.querySelector('#Tears')
const FreeMemOutput = document.querySelector('#FreeMem')
const GPUOutput = document.querySelector('#GPU')
const CPUOutput = document.querySelector('#CPU')
const AppOutput = document.querySelector('#App')

const startLogcatBtn = document.querySelector('#start_logcat_btn')
const sceenCap_btn = document.querySelector('#screenCap_btn')
const logToFileBtn = document.querySelector('#logToFile_btn')
const clearLogBtn = document.querySelector('#clearLog_btn')


const allValues = document.querySelectorAll('.val')
let logToFile = false

const socket = io.connect()
// let debugMessage = 'DebugMessege Here'

const warrningLevels = {
    FPS : 65,
    Stale : 1,
    Tear : 1,
}

startLogcatBtn.addEventListener('click', () =>{

    socket.emit('startLogcat')

})
logToFileBtn.addEventListener('click', () =>{
    logToFile = !logToFile;
    console.log(logToFile)
})
clearLogBtn.addEventListener('click', ()=>{
    console.log('log cleared')
    socket.emit('clearLog')
})

function parseVrApi(log, dataToFind) {
    let stringLog = `${log}`
    let logArray = stringLog.split(/,|=| /)

    let VrApi = new Object

    for (let i = 0; i < dataToFind.length; i++) {
        const wanted = dataToFind[i];
        for (let t = 0; t < logArray.length; t++) {
            const suspect = logArray[t];
            if (suspect === wanted) {
                VrApi[wanted] = logArray[t+1]
                break
            }
        }
    }
    Object.keys(VrApi).forEach((name,index)=>{
        if (VrApi[name].includes('(')) {
            VrApi[name] = VrApi[name].substr(0, VrApi[name].indexOf('('))
        }
    })

    if(logToFile){
        LogToFile(VrApi, dataToFind)
    }

    return VrApi
}

socket.on('res', (res) => {
    // console.log(res)

    const dataToFind = ['FPS', 'Tear', 'Stale', 'Free', 'GPU%', 'CPU%', 'App']
    
    let VrApiParsed = parseVrApi(res, dataToFind)
    console.log(VrApiParsed)

    UpdateScreen(VrApiParsed)

    // const desiredObj = debugMessage
    //     .split(' ')
    //     .filter(str => str.includes(dataToFind[0]))[0]
    //     .split(',')
    //     .filter(str => dataToFind.some(x => str.includes(x)))
    //     .map(str => ({name: str.substr(0, str.indexOf('=')), value: str.substr(str.indexOf('=')+1)}))
    //     .reduce((acc, obj) => {acc[obj.name] = obj.value; return acc;}, {})

    // console.log(desiredObj);

})
socket.on('screenCapRes', (res) =>{
    console.log(res)
})


function UpdateScreen(VrApi) {
    CheckForWarnings()
    if(VrApi['FPS']){
        FPSOutput.innerHTML = VrApi['FPS']
        StaleOutput.innerHTML = VrApi['Stale']
        TearsOutput.innerHTML = VrApi['Tear']
        FreeMemOutput.innerHTML = VrApi['Free']
        GPUOutput.innerHTML = VrApi['GPU%']
        CPUOutput.innerHTML = VrApi['CPU%']
        AppOutput.innerHTML = VrApi['App']
    }

}
function setOK(property) {
    property.parentElement.classList.remove('critical')
    property.parentElement.classList.remove('warrning')
}

function setWarrning(property) {
    property.parentElement.classList.remove('critical')
    property.parentElement.classList.add('warrning')
}

function setCritical(property) {
    property.parentElement.classList.remove('warrning')
    property.parentElement.classList.add('critical')
}

function CheckForWarnings() {
    
    allValues.forEach((property,index)=>{
        const valName = property.id
        
        //FPS
        if(valName == 'FPS'){

            if (property.innerHTML >= warrningLevels.FPS) {
                setOK(property)
            }else
            if (property.innerHTML < warrningLevels.FPS) setWarrning(property)
            if(property.innerHTML < warrningLevels.FPS/2) setCritical(property)
        }
        //Stale
        if(valName == 'Stale'){
            if (property.innerHTML <= warrningLevels.Stale) {
                setOK(property)
            }else
            if (property.innerHTML > warrningLevels.Stale) setWarrning(property)
            if(property.innerHTML > warrningLevels.Stale*2) setCritical(property)    
        }
        //Tear
        if(valName == 'Tear'){
            if (property.innerHTML <= warrningLevels.Tear) {
                setOK(property)
            }else
            if (property.innerHTML > warrningLevels.Tear) setWarrning(property)
            if(property.innerHTML > warrningLevels.Tear*2) setCritical(property)
        }
    })
}

// inputFile.addEventListener('change', (path) =>{
//     console.log("input Triggerd")
//     debugMessage = path
//     UpdateScreen()
// })


sceenCap_btn.addEventListener('click', ()=>{
    console.log(`dups`)
    socket.emit('screenCap')
})
// let keysDown = {}
// window.onkeydown = function(el) {
//     keysDown[el.key] = true
//     if(keysDown["Control" && keysDown["s"]]){
//         screenCap_btn.click()
//         console.log('control + s')
//     }
// }
// window.onkeyup = function(el) {
//     keysDown[el.keys] = false
// }


function LogToFile(vrapi, dataToFind) {
    let parsedData = ''
    dataToFind.forEach(name => {
        parsedData += name + ' '
        parsedData += vrapi[name] + ' ' 
    });

    socket.emit('logToFile', parsedData)

}
