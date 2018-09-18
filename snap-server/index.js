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

	//Legacy feature, just to keep things running
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
				.brightness(0) //BRIGHTNESS
				.dither565()
				.greyscale()
				.dither565()
				.contrast(1)
				.write(__dirname + '/uploads/'+filename, ()=>{

					let template = fs.readFileSync(__dirname + '/html/template.html', 'utf8')

					template = template.replace('{{PHOTOID}}', filename)

					let gender_translate = {"male":"maennlich", "female":"weiblich"}
					template = template.replace('{{GENDER}}', gender_translate[json_result[0].faceAttributes.gender])

					template = template.replace('{{AGE}}', json_result[0].faceAttributes.age)


					let valueTempHair = 0, valueHair = 0, stringHair = ''

					let hairColors = {
			            'black': 'schwarz',
			            'brown': 'braun',
			            'blond': 'blond',
			            'other': 'andere',
			            'red': 'rot',
			            'gray': 'grau'
			        }

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
			        	template = template.replace('{{HAIR}}', 'Nicht sichtbar')
			        }else if(json_result[0].faceAttributes.hair.bald > 0.9){
			        	template = template.replace('{{HAIR}}', 'Glatze')
			        }else {
			        	template = template.replace('{{HAIR}}', stringHair + ' (' + valueHair + ')')
			        }

			        template = template.replace('{{GLASSES}}', ((json_result[0].faceAttributes.glasses == "NoGlasses") ? 'Nein' : 'Ja'))

			        var makeupStr = ''
			        if(json_result[0].faceAttributes.makeup.eyeMakeup) makeupStr += 'Augen'
			        if(json_result[0].faceAttributes.makeup.eyeMakeup && json_result[0].faceAttributes.makeup.lipMakeup) makeupStr += ', '
			        if(json_result[0].faceAttributes.makeup.lipMakeup) makeupStr += 'L1ppen'
			        if(makeupStr != ''){
			        	template = template.replace('{{MAKEUP}}', '<tr><td colspan="2"><strong>Mak3up:</strong><br />'+makeupStr+'</td></tr>')
			        }else{
			        	template = template.replace('{{MAKEUP}}', '')
			        }

			        var fhairStr = ''
			        if(json_result[0].faceAttributes.facialHair.moustache > 0.5) fhairStr += 'Schnurrbart'
			        if(json_result[0].faceAttributes.facialHair.beard > 0.5) fhairStr += ((json_result[0].faceAttributes.facialHair.moustache > 0.5)?', ':'')+'Bart'
			        if(json_result[0].faceAttributes.facialHair.sideburns > 0.5) fhairStr += ((json_result[0].faceAttributes.facialHair.moustache > 0.5 || json_result[0].faceAttributes.facialHair.beard)?', ':'')+'Koteletten'
			        if(fhairStr != ''){
			        	template = template.replace('{{FACEHAIR}}', '<tr><td colspan="2"><strong>Ges1chtsbehaarung:</strong><br />'+fhairStr+'</td></tr>')
			        }else{
			        	template = template.replace('{{FACEHAIR}}', '')
			        }

			        var smileStr = 'Nein'
					if(json_result[0].faceAttributes.smile > 0.5) smileStr = 'Ja'
					template = template.replace('{{SMILE}}', smileStr)

			   
			    	let emotions = {
			            'happiness': 'gluecklich',
			            'surprise': 'ueberrascht',
			            'anger': 'wuetend',
			            'contempt': 'kritisch',
			            'disguist': 'ekelnd',
			            'disgust': 'ekelnd',
			            'fear': 'aengstlich',
			            'neutral': 'neutral',
			            'sadness': 'traurig'
			        }
			        
			        let emotion_str = '', emotion_str_a = [[]], emotion_str_ai = 0

					for(let property in json_result[0].faceAttributes.emotion){
						let val = parseFloat(json_result[0].faceAttributes.emotion[property])
						if(val > 0){
							if(emotion_str_a[emotion_str_ai].length == 2){
								emotion_str_ai++; 
								emotion_str_a.push([])
							}
							emotion_str_a[emotion_str_ai].push(emotions[property]+' ('+val+')')
						}
					}

					if(emotion_str_a[emotion_str_ai].length==1){
						emotion_str_a[emotion_str_ai].push('')
					}

					emotion_str_a.forEach(a=>{
						emotion_str += '<tr><td>'+a.join('</td><td>')+'</td></tr>'
						
					})

					template = template.replace('{{EMOTIONS}}', emotion_str)

					fs.writeFileSync(__dirname + '/html/generated.html', template, 'utf8')

					//Windows Only
					let stdout = execSync('phantomjs rasterize.js http://localhost:3000/ snap.pdf 62mm*200mm');
					console.log('rasterize')
					let stdout1 = execSync('PDFtoPrinter.exe snap.pdf "Brother QL-800"');
					console.log('print')
					let stdout2 = execSync('nircmd win activate title "LNDW - Google Chrome"');

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