const SerialPort = require("serialport")

const megaID = '55736303739351D012A1'

SerialPort.list().then(list=>{
  list.forEach(l=>{
    if(('manufacturer' in l) && l.manufacturer != undefined && l.manufacturer.indexOf('Arduino')>-1){
      if(('serialNumber' in l)&&(megaID == l.serialNumber)){
        console.log('mega',l)
      }else{
        console.log('other', l)
      }
    }
  })
}).catch(err=>{
  throw err
})


// const	port = new SerialPort("/dev/cu.usbmodem1411", {
//    baudRate: 9600
// })

// port.on('error', function(err) {
//   console.log('Error: ', err.message)
// })

// let message = ''

// port.on('data', function(data){
//   message += data.toString('utf8')
//   if(message.indexOf('\n')>=0){
//     console.log('MSG:', message)
//     message = ''
//   }
// })

// port.on('open', function(){
//   console.log('Serial Port Opend')

//   setTimeout(()=>{

//     port.write('$')
//     port.write('blinkOn')
//     port.write('$')
//     port.write('1')
//     port.write('\n')

//     console.log('message send: blinkOn')

//     setTimeout(()=>{

//         port.write('$')
//         port.write('blinkOff')
//         port.write('$')
//         port.write('2')
//         port.write('\n')

//         console.log('message send: blinkOff')

//     }, 3000)

//   }, 3000)

// })