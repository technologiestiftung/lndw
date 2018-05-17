const	sqlite = require('better-sqlite3'),
      	db = new sqlite(__dirname + '/database.db'),
      	express = require('express'),
  		fs = require('fs'),
  		formidable = require('formidable'),
  		FaceAPIClient = require('azure-cognitiveservices-face'),
  		CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials,
  		config = require('./config.json')

let credentials = new CognitiveServicesCredentials(config.azure.key1),
	client = new FaceAPIClient(credentials, config.azure.region);
 
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
			fs.writeFileSync('./test/output.json', httpResponse.response.body, 'utf8')
			return res.status(200).json(JSON.parse(httpResponse.response.body))
		}).catch((err) => {
			throw err
		})

    })
})

const port = process.env.PORT || 5971;
app.listen(port, () => {
 console.log("Listening on " + port);
})