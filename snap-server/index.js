const	sqlite = require('better-sqlite3'),
      	db = new sqlite(__dirname + '/database.db'),
      	express = require('express'),
  		fs = require('fs')

const app = express()

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
  res.header("Access-Control-Allow-Headers", "Content-Type, X-Requested-With")
  next();
})

app.get("/hello", function(req, res) {
  res.status(200).send('Hello World');
});

const port = process.env.PORT || 8080;
app.listen(port, function() {
 console.log("Listening on " + port);
});

