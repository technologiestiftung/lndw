const 	SerialPort = require("serialport")
const	port = new SerialPort("/dev/cu.usbmodem143441")

// Open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message)
})

let message = ''

port.on('open', function(){
  console.log('Serial Port Opend')
  port.on('data', function(data){
  	message += data.toString('utf8')
  	if(message.indexOf('\n')>=0){
  		console.log(message)
  		message = ''
  	}
  })
})

setTimeout(()=>{
	port.write('test ajsdhflakjshdfkajhsdlfkajhsdlfha sldkhj')
	port.write('\n')
}, 3000)