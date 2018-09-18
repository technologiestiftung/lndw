const http = require('http')
const fs = require('fs')
const port = 3000

const requestHandler = (request, response) => {
	if(request.url.indexOf('images')>=0){
		response.end(fs.readFileSync('./html/' + request.url))
	}else if(request.url.indexOf('uploads')>=0){
		response.end(fs.readFileSync('.' + request.url))
	}else{
		response.end(fs.readFileSync('./html/generated.html', 'utf8'))
	}
}

const server = http.createServer(requestHandler)

server.listen(port, err => {
	if(err) return console.log('something bad happened', err)

	console.log(`Server is listening on ${port}`)
})