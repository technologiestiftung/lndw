const SerialPort = require("serialport")

const megaID = '55736303739351D012A1'

let arduinos = {
	  mega:null, 
	  other:null
	}, 
	port = null,
	message = ''

SerialPort.list().then(list=>{
	list.forEach(l=>{
		if(('manufacturer' in l) && l.manufacturer != undefined && l.manufacturer.indexOf('Arduino')>-1){
		  if(('serialNumber' in l)&&(megaID == l.serialNumber)){
		    arduinos.mega = l
		  }else{
		    arduinos.other = l
		  }
		}
	})

	if(arduinos.other != null){

	  	port = new SerialPort(arduinos.other.comName, {
		   baudRate: 9600
		})

		port.on('error', function(err) {
		  console.log('Error: ', err.message)
		})

		port.on('data', function(data){
		  message += data.toString('utf8')
		  if(message.indexOf('\n')>=0){
		    console.log('MSG:', message)
		    message = ''
		  }
		})

		port.on('open', function(){
		  console.log('Serial Port Opend')
		})
	}

}).catch(err=>{
  throw err
})

const	sqlite = require('better-sqlite3'),
      	db = new sqlite(__dirname + '/database.db'),
      	express = require('express'),
      	moment = require('moment'),
  		fs = require('fs'),
  		formidable = require('formidable'),
  		FaceAPIClient = require('azure-cognitiveservices-face'),
  		CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials,
  		config = require(__dirname + '/config.json'),
		{ execSync } = require('child_process'),
		uuidv1 = require('uuid/v1'),
		Jimp = require("jimp"),
		getPixels = require("get-pixels")

let stdout = execSync(`export PATH=$PATH:${config.arduino.appPath}`);
console.log(config.arduino.appPath)
 
let credentials = new CognitiveServicesCredentials(config.azure.key1),
	client = new FaceAPIClient(credentials, config.azure.region);

db.prepare("CREATE TABLE IF NOT EXISTS faces (" +
      "id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, " +
      "ms_id text" + 
      ")").run()

db.prepare("CREATE TABLE IF NOT EXISTS face_event (" +
      "id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, " +
      "face_id INTEGER, " + 
      "timestamp datetime " + 
      ")").run()

db.prepare("CREATE TABLE IF NOT EXISTS face_metrics (" +
      "id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT, " +
      "face_event INTEGER, " + 
      "attribute text," + 
      "value text" + 
      ")").run()

const app = express()

app.all('/*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "*")
  next()
})

app.use(express.static('uploads'));

app.get("/hello", (req, res)=>{
  res.status(200).send('Hello World');
})

app.get("/data", (req, res)=>{
	let rows = db.prepare('SELECT * FROM face_metrics').all([])
	res.status(200).json(rows)
})

app.get("/command/:cmd/:data", (req, res)=>{

    port.write('$')
    port.write(req.params.cmd)
    port.write('$')
    port.write(req.params.data)
    port.write('\n')

	res.status(200).json({msg:'Command send.'})
})

app.post("/analyse", (req, res)=>{
	res.header("Access-Control-Allow-Origin", "*")
	let form = new formidable.IncomingForm()
    form.multiples = true
    form.keepExtensions = true
    form.uploadDir = __dirname + '/uploads/'
    form.parse(req, (err, fields, files) => {
      if (err) return res.status(500).json({ error: err })

      	let filename = uuidv1() + '.png';

      	console.log('filename', filename)

      	if(('rotate' in fields)){

      		let base = fields['base64image'].replace(/^data:image\/png;base64,/, "")

			Jimp.read(Buffer.from(base, 'base64'), (err, img) => {
				if (err) throw err;

				img.rotate(parseFloat(fields.rotate))
					.write(__dirname + '/uploads/' + filename, ()=>{
						msProcess(filename, req, res)
					})
			})

		}else{
			fs.writeFileSync(__dirname + '/uploads/' + filename, fields['base64image'].replace(/^data:image\/png;base64,/, ""), 'base64')
			msProcess(filename, req, res)
		}

    })
})

function msProcess (filename, req, res){
	let fileStream = fs.createReadStream(__dirname + '/uploads/' + filename)

	client.face.detectInStreamWithHttpOperationResponse(fileStream, {
		returnFaceId:true,
		returnFaceLandmarks:true,
		returnFaceAttributes: 'age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,exposure,noise'.split(',')
	}).then((httpResponse) => {
		//fs.writeFileSync(__dirname + '/test/output.json', httpResponse.response.body, 'utf8')

		let json_result = JSON.parse(httpResponse.response.body)

		if(json_result.length>=1){

			json_result[0]['filename'] = filename;

			let id = null, rows = db.prepare("SELECT id FROM faces WHERE ms_id = ?").all([json_result[0].faceId])

			if(rows.length>0){
				id = rows[0].id
			}else{
				let row = db.prepare("INSERT INTO faces (ms_id)VALUES(?)").run([json_result[0].faceId])
				id = row.lastInsertROWID
			}

			let event_row = db.prepare("INSERT INTO face_event (face_id, timestamp)VALUES(?, ?)").run([id, moment().format('YYYY-MM-DD HH:mm:ss')])
			let event_id = event_row.lastInsertROWID

			parseAttributes(json_result[0], event_id, '')

			Jimp.read(__dirname + '/uploads/' + filename, (err, img) => {
				if (err) throw err;

        		let img_border = json_result[0].faceRectangle.width*0.3

        		//TODO Dynamic brightness factor depending on black/white ratio  

				let buf = img.crop(json_result[0].faceRectangle.left-img_border, json_result[0].faceRectangle.top-img_border, json_result[0].faceRectangle.width+2*img_border, json_result[0].faceRectangle.height+2*img_border)
					.scaleToFit(384,500)
					.dither565()
					.brightness(0.25)
					.dither565()
					.greyscale()
					.dither565()
					.contrast(1)
					.write(__dirname + '/uploads/'+filename, ()=>{

						let template = fs.readFileSync(__dirname + '/arduino/src/sketch/sketch-template.txt', 'utf8')

						  getPixels(__dirname + '/uploads/'+filename, function(err, pixels) {
    						if(err) console.log("Bad image path")

      						let bw_pixels = []

						    for(let i = 0; i<pixels.data.length; i+=4){
						      if(pixels.data[i] < 50){
						        bw_pixels.push(0)
						      }else{
						        bw_pixels.push(1)
						      }
						    }

						    let img = {width:384, height:384},
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
						            //byteStr += "\n ";
						            bytesOnLine = 0;
						        }

						        let tStr = sum.toString(16).toUpperCase()

						        if(byteStr != ''){
						        	byteStr+=','
						        }

						        byteStr += '0x'+(((tStr+'').length<2)?'0'+tStr:tStr) //
						        //output.format(" 0x%02X", sum); // Write accumulated bits

						        byteNum++
						        //if(byteNum < totalBytes) byteStr += ',';
						      }
						      //process.exit()
						    }

						    template = template.replace('||PROFILE||', byteStr)

						    let metadata_str = '',
						    	emotions = {
						            'happiness': 'gluecklich',
						            'surprise': 'ueberrascht',
						            'anger': 'wuetend',
						            'contempt': 'missachtend',
						            'disguist': 'ekelnd',
						            'fear': 'aengstlich',
						            'neutral': 'neutral',
						            'sadness': 'traurig'
						        },
						        hairColors = {
						            'black': 'schwarz',
						            'brown': 'braun',
						            'blond': 'blond',
						            'other': 'andere',
						            'red': 'rot',
						            'gray': 'grau'
						        }

						    metadata_str += 'printer.println(F("ALT3R: '+json_result[0].faceAttributes.age+' Jahre"));';

						    let gender_translate = {"male":"maennlich", "female":"weiblich"}
						    metadata_str += 'printer.println(F("Geschlecht: '+gender_translate[json_result[0].faceAttributes.gender]+'"));';
							
							metadata_str += 'printer.println(F("EM0T10NEN:"));';
							
							for(let property in json_result[0].faceAttributes.emotion){
								let val = parseFloat(json_result[0].faceAttributes.emotion[property])
								if(val > 0){
									metadata_str += 'printer.println(F("'+emotions[property]+' ('+val+')"));';
								}
							}
        
							let valueTempHair = 0, valueHair = 0, stringHair = ''

					        for (var property in json_result[0].faceAttributes.hair.hairColor) {
					            let stringTempHair = json_result[0].faceAttributes.hair.hairColor[property].color;
					            valueTempHair =  json_result[0].faceAttributes.hair.hairColor[property].confidence;
					            valueHair = (valueTempHair > valueHair) ? valueTempHair : valueHair; 
					            if (valueHair === valueTempHair) { 
					                for (var responseHairColor in hairColors) {
					                    stringHair = hairColors[stringTempHair];
					                };
					            };
					        }

					        if(json_result[0].faceAttributes.hair.invisible == true){
					            metadata_str += 'printer.println(F("Haare: Nicht sichtbar"));';
					        }else if(json_result[0].faceAttributes.hair.bald > 0.9){
					            metadata_str += 'printer.println(F("Haare: Glatze"));';
					        }else {
					        	metadata_str += 'printer.println(F("Haare: '+stringHair + ' (' + valueHair + ')"));';
					        }

					        metadata_str += 'printer.println(F("Bri||e: '+((json_result[0].faceAttributes.glasses == "NoGlasses") ? 'Nein' : 'Ja')+'"));';

					        var makeupStr = ''
					        if(json_result[0].faceAttributes.makeup.eyeMakeup) makeupStr += 'Augen'
					        if(json_result[0].faceAttributes.makeup.eyeMakeup && json_result[0].faceAttributes.makeup.lipMakeup) makeupStr += ', '
					        if(json_result[0].faceAttributes.makeup.lipMakeup) makeupStr += 'L1ppen'
					        if(makeupStr != ''){
					            metadata_str += 'printer.println(F("Makeup: '+makeupStr + '"));';
					        }

					        var fhairStr = ''
					        if(json_result[0].faceAttributes.facialHair.moustache > 0.5) fhairStr += 'Schnurrbart'
					        if(json_result[0].faceAttributes.facialHair.beard > 0.5) fhairStr += ((json_result[0].faceAttributes.facialHair.moustache > 0.5)?', ':'')+'Bart'
					        if(json_result[0].faceAttributes.facialHair.sideburns > 0.5) fhairStr += ((json_result[0].faceAttributes.facialHair.moustache > 0.5 || json_result[0].faceAttributes.facialHair.beard)?', ':'')+'Koteletten'
					        if(fhairStr != ''){
					        	metadata_str += 'printer.println(F("Ges1chtsbehaarung: ' + fhairStr + '"));';
					        }

        					var smileStr = 'Nein'
        					if(json_result[0].faceAttributes.smile > 0.5) smileStr = 'Ja'
        					metadata_str += 'printer.println(F("Laecheln: ' + smileStr + '"));';

						    template = template.replace('||METADATA||', metadata_str)
							
							fs.writeFileSync(__dirname + '/arduino/src/sketch/sketch.ino', template, 'utf8')

							let stdout = execSync(` arduino --upload ${config.arduino.sketchPath}sketch.ino --port ${arduinos.mega.comName} --board arduino:avr:mega`);
							let stdout1 = execSync('open -a "Google Chrome"');

						 })

					});
			})

			return res.status(200).json(json_result)

		}else{
			return res.status(200).json({'msg':'no face found'})
		}
	}).catch((err) => {
		throw err
	})
}

function parseAttributes(json, id, prefix){
	for(let key in json){
		if(typeof json[key] == 'object'){
			parseAttributes(json[key], id, prefix+((prefix=='')?'':'_')+key)
		}else{
			db.prepare("INSERT INTO face_metrics (face_event, attribute, value)VALUES(?,?,?)").run([id, prefix+((prefix=='')?'':'_')+key, transBool(json[key])])
		}
	}
}

function transBool(v){
	if(v == false){
		return 0
	}else if(v == true){
		return 1
	}
	return v
}

const web_port = process.env.PORT || 5971;
app.listen(web_port, () => {
 console.log("Listening on " + web_port);
})