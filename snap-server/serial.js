// const SerialPort = require("serialport")
// const	port = new SerialPort("/dev/cu.usbmodem143441", {
//   baudRate: 115200
// })

const Jimp = require("jimp")

const getPixels = require("get-pixels")

const fs = require('fs')

// Open errors will be emitted as an error event
// port.on('error', function(err) {
//   console.log('Error: ', err.message)
// })

// let message = '', start = null

// port.on('data', function(data){
//   message += data.toString('utf8')
//   if(message.indexOf('\n')>=0){
//     console.log('MSG:', message)
//     message = ''
//   }
// })

function decimalToHexString(number)
{
    if (number < 0)
    {
        number = 0xFFFFFFFF + number + 1;
    }

    return number.toString(16).toUpperCase();
}


// port.on('open', function(){
//   console.log('Serial Port Opend')

//   setTimeout(()=>{
    Jimp.read("./uploads/test.png", function (err, img) {
      if (err) throw err;

      let buf = img.scaleToFit(380,450)
        .greyscale()
        .brightness(0)
        .contrast(1)

      // buf.getBuffer(Jimp.MIME_PNG, (err, buff)=>{
      //   if(err) console.log(err)  
        
      //   console.log(buff)
      // })

      //console.log(buf.bitmap.data[12])

      // let imgdata = []

      // buf.bitmap.data.forEach(d=>{
      //   imgdata.push('0x'+d.toString(16).toUpperCase())
      // })


      // fs.writeFileSync('./test/buffer.txt', imgdata.join(','))

      
        //.write("./test/seb-bw.png", (err)=>{

          // let imgB = fs.readFileSync("./test/seb-bw.png", 'utf8')
          // console.log(imgB)

          // console.log(imgB.length, imgB.readInt8(0), imgB.readInt8(0).toString(4), decimalToHexString(imgB.readInt8(0)))

          // console.log(imgB.toString('uint8'))

          getPixels("./test/seb-bw.png", function(err, pixels) {
            if(err) console.log("Bad image path")
              let bw_pixels = []

            for(let i = 0; i<pixels.data.length; i+=4){
              if(pixels.data[i] < 50){
                bw_pixels.push(0)
              }else{
                bw_pixels.push(1)
              }
            }

            asciTest = '', b_c = 0

            bw_pixels.forEach(p=>{
              asciTest += p
              b_c++;
              if(b_c == 380){
                asciTest += '\n'
                b_c = 0
              }
            })

            fs.writeFileSync('./test/asciTest.txt', asciTest, 'utf8')

            // port.write(bw_pixels.join(''))
            // port.write('\n')

            let img = {width:380, height:214},
                rowBytes = Math.round(img.width / 8),
                totalBytes = Math.round(rowBytes * img.height)
                pixelNum = 0, 
                byteNum = 0, 
                bytesOnLine = 99

            let byteStr = ''

            for(let y=0; y<img.height; y++) {
              for(let x=0; x<Math.floor(rowBytes); x++) {
                let lastBit = (x < rowBytes - 1) ? 1 : (1 << (rowBytes * 8 - img.width))
                let sum = 0

                let before = pixelNum

                for(let b=128; b>=lastBit; b >>= 1) { // Each pixel within block...
                  if(bw_pixels[pixelNum++] == 0) sum |= b; // If black pixel, set bit
                }

                //console.log(x, x*8, 380, before, pixelNum, rowBytes)

                bytesOnLine++
                if(bytesOnLine >= 10) {
                    byteStr += "\n ";
                    bytesOnLine = 0;
                }

                let tStr = sum.toString(16).toUpperCase()

                byteStr += ' 0x'+(((tStr+'').length<2)?'0'+tStr:tStr)+',' //
                //output.format(" 0x%02X", sum); // Write accumulated bits

                byteNum++
                //if(byteNum < totalBytes) byteStr += ',';
              }
              //process.exit()
            }

            fs.writeFileSync('./test/byteStr.txt', byteStr, 'utf8')

            let test = '', test_a = []
            pixels.data.forEach((p,pi)=>{
               test_a.push((p==0)?'0x00':'0xFF')
               if(8%pi)test_a.push('\n')
            })
            test = '{' + test_a.join(',') + '}';

            fs.writeFileSync('./test/uint8.txt', test, 'utf8')

          })
        })
//    })
//   }, 0)
// })
