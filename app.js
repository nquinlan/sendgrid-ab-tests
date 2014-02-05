var express = require('express');
var https = require('https');
var http = require('http');
var app = express();

var request = require('request');
var url = require('url');

// Express Configurations!
app.configure(function(){
	app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use( express.static(__dirname + '/public') );
});

if(process.env.NODE_ENV === 'production'){
	// Redirect all non SSL requests to SSL
	// taken from: http://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect
	app.get('*',function(req,res,next){
		if(req.headers['x-forwarded-proto']!='https') {
			res.redirect('https://' + req.get('host') + req.url);
		} else {
			next();
		}
	});
}

// Display the static file that does all the work
app.all('/', function (req, res) {
	res.sendfile('public/index.html');
});

// Proxy SendGrid's Stats Endpoint, to get around CORS
app.get('/stats', function (req, res) {
	
	// We get the query string and manually append it to preserve EVERY part of the query string
	var query = url.parse(req.url).query;

	request(
		{
			"url": "https://api.sendgrid.com/api/stats.get.json?" + query,
		},
		function (error, response, body) {
			if (!error) {
				try {
					var json = JSON.parse(response.body);
					res.status(response.statusCode);
					res.send(json);
				} catch (e) {
					console.log(e);
					res.status(response.statusCode);
					res.send({"error":"Improperly formatted response from SendGrid"});
				}
			}
		}
	);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});