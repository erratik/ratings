var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var moment = require('moment');
var jsonfile = require('jsonfile');
var util = require('util');
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)

	app.use('/bower_components', express.static(__dirname + '/bower_components'));                                         // log every request to the console

	app.use(morgan('dev'));


var urls = {};
var urlFile = 'urls.json';
jsonfile.readFile(urlFile, function(err, obj) {
    urls = obj;
});
var ratings;
var ratingsFile = 'ratings.json';
jsonfile.readFile(ratingsFile, function(err, obj) {
    ratings = obj;
});

app
	.get('/ratings/get/:count', function(req, res) {

		var dates = Object.keys(urls);
		// console.log(typeof ratings);
		var start = (typeof ratings != 'undefined') ? Object.keys(ratings).length  : 0;
		var limit = (typeof ratings != 'undefined') ? (Object.keys(ratings).length+Number(req.params.count)) : req.params.count;

		console.log("start is  " + start);
		console.log("limit is " + limit);

		var newRatings = {};

		for (var i = 0; i >= start && i < limit && i <= dates.length; i++) {
			console.log('test');
				console.log(i);
				var date = dates[i];

			    request('http://localhost:8081/ratings/'+date+'/all', function(error, response, html) {
			    	// console.log('test');
			    	if (!error) {
			    		// console.log(response);
			    		if (i == req.params.count) console.log(response.body);
			    	} else {
			    		console.log(error);
			    	}
			    });
		}

	})
	.get('/links/:start', function(req, res) {
	    var start = req.params.start;
	    for (var i = start; i > 0; i--) {
	        // console.log(i);
	        url = 'http://www.mediaite.com/tag/cable-news-ratings/page/' + i + '/';
	        request(url, function(error, response, html) {
	            if (!error) {
	                var $ = cheerio.load(html);
	                var title, release, rating;
	                $('.posts .post0').filter(function() {
	                    var data = $(this);
	                    date = data.find('.dateline').text().split('\n');
	                    var str = date[2];
	                    var result = str.replace(/\W+([0-9A-Za-z]+)/g, '$1|');
	                    var url = $(this).find('a').attr('href');
	                    if (url.indexOf('cable-ratings') != -1) {
	                        urls[moment(result, "MMMM|Do|YYYY|").format('X')] = url;
	                    }
	                });
	            }
	            fs.writeFile('urls.json', JSON.stringify(urls, null, 4), function(err) {
	                // console.log('File successfully written! - Check your project directory for the output.json file');
	            });
	        });
	        if (i == 1) {
	            jsonfile.readFile(urlFile, function(err, obj) {
	                // console.dir(obj)
	                urls = obj;
	                res.send(urls);
	            });
	        }
	    };
	})
	.get('/ratings/:date/:networks', function(req, res) {
	    request(urls[req.params.date], function(error, response, html) {
	        if (!error) {
	            var $ = cheerio.load(html);

	            $('table.ratings').first().filter(function() {
	                var $table = $(this);

  					// var networks = {};
	                // if (req.params.networks != 'all') {
	                // 	networks = req.params.networks.split(',');
	                // 	console.log(networks);
	                // }

	                var network_classes = [''];
	                var theseRatings = {};
	                $table.find('.table-header:not(:empty)').filter(function(){
	                	var nameStr = $(this).find('img').attr('src').split('logo-')[1];
	                	var namespace = nameStr.split('.')[0];
	                	// console.log(namespace);
	                	network_classes.push(namespace);
	                	theseRatings[namespace] = [];
	                });


	                $table.find('tr').filter(function(index){
	                	var $row = $(this);
	                	$row.find('td').each(function(idx){
	                		$(this).attr('data-network', network_classes[idx]);
		                	if (index > 1 && idx ) {
		                		var value = $(this).find('p:last-child').text();
		                		if (!$(this).find('p').length) {
									value = $(this).text();
		                		}
		                		theseRatings[network_classes[idx]].push(value);
		                	}
	                	});
	                });

					if (typeof ratings == 'undefined') ratings = {};
	                ratings[req.params.date] = theseRatings;

	                // console.log(urls[req.params.date]);

			        fs.writeFile('ratings/'+moment.unix(req.params.date).format('YYYYMMDD')+'.json', JSON.stringify(theseRatings, null, 4), function(err) {
			           	if (!err) {
			           		//console.log('File successfully written! - Check your project directory for the output.json file');
			           	} else {
			           		console.log(err);
			           	}
			        });

	                res.send(theseRatings);

	            });
	        }
	    });
	});


// Serve static files
app.use(express.static('./app'));

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;