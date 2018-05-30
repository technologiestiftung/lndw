const	sqlite = require('better-sqlite3'),
      	db = new sqlite(__dirname + '/database.db'),
      	express = require('express'),
      	moment = require('moment'),
  		fs = require('fs'),
  		formidable = require('formidable'),
  		FaceAPIClient = require('azure-cognitiveservices-face'),
  		CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials,
  		config = require(__dirname + '/config.json'),
		{ execSync } = require('child_process')

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
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
  next()
})

app.get("/hello", (req, res)=>{
  res.status(200).send('Hello World');
})

app.get("/data", (req, res)=>{
	let rows = db.prepare('SELECT * FROM face_metrics').all([])
	res.status(500).json(rows)
})

app.get("/print", (req, res)=>{
	let stdout = execSync(' arduino --upload /Users/sebastianmeier/Sites/TSB/lndw-2018/snap-server/arduino/src/sketch/sketch.ino --port /dev/cu.usbmodem141441 --board arduino:avr:mega');
	res.status(500).json({"status":"printing"})
})

app.post("/analyse", (req, res)=>{
	let form = new formidable.IncomingForm()
    form.multiples = true
    form.keepExtensions = true
    form.uploadDir = __dirname + '/uploads/'
    form.parse(req, (err, fields, files) => {
      if (err) return res.status(500).json({ error: err })

		require("fs").writeFileSync(__dirname + '/uploads/test.png', fields['base64image'].replace(/^data:image\/png;base64,/, ""), 'base64')

  		let fileStream = fs.createReadStream(__dirname + '/uploads/test.png')

		client.face.detectInStreamWithHttpOperationResponse(fileStream, {
			returnFaceId:true,
			returnFaceLandmarks:true,
			returnFaceAttributes: 'age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,exposure,noise'.split(',')
		}).then((httpResponse) => {
			fs.writeFileSync(__dirname + '/test/output.json', httpResponse.response.body, 'utf8')

			let json_result = JSON.parse(httpResponse.response.body)

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

			return res.status(200).json(json_result)
		}).catch((err) => {
			throw err
		})

    })
})

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

const port = process.env.PORT || 5971;
app.listen(port, () => {
 console.log("Listening on " + port);
})