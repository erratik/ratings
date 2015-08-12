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


var urls = {}, dates;   
	var ratings = [];

jsonfile.readFile('urls.json', function(err, obj) {
    urls = obj;
	dates = Object.keys(obj);

	for (var i = 0; i < dates.length; i++) {
		// urls
		// console.log(dates[i]);
		jsonfile.readFile('./ratings/'+moment.unix(dates[i]).format('YYYYMMDD')+'.json', function(err, obj) {
			if (err) {
				// console.log('no ratings files yet');
			} else {
				// console.log(obj);
				var ratingsObj = {};
				ratingsObj[dates[i]] = obj;
			    ratings.push(ratingsObj);
			}
		});
	}

});

app
	.get('/ratings/get/:start/:count', function(req, res) {

		console.log(" ");
		console.log('ratings count -> '+ratings.length);
		if (ratings.length) var _ratings = Object.keys(ratings[0]);

		var start = (!ratings.length) ? 11 : moment(req.params.start, 'YYYYMMDD').format('X');
		// console.log(start);
		if (ratings.length) console.log(ratings[11]);

		var count = Number(req.params.count);
		start = Number(start);
		console.log(" ");
		console.log(" - - -");
		console.log('getting '+count+' from ' + start +' in ' + dates.length + ' dates');
		console.log(" - - -");
		console.log(" ");


		// takes an array of utc dates, references the urls.json file link for it 
		// by calling /ratings/:date, and returns the fetched ratings
		var checkDate = function(date) {
			console.log('date: '+date)
			//console.log(date);

		    request('http://localhost:8081/ratings/'+date+'/all', function(error, response, html) {
		    	// console.log('test');
		    	if (!error) {
		    		// console.log(response);
		    		console.log(response.body);
		    	} else {
		    		console.log(error);
		    	}
		    });
		};
		
		//makes an array of dates
		var range = dates.slice(start, start+count); 
		var _timeout = 10;
		if (range.length == count) {
			// go through the range and run checkDate()
			var i = 0;
			checkDate(range[0]);
			(function(range, i){

				console.log(i);
				setInterval(function(){
					// i++;
					if (++i < count) checkDate(range[i]);
					console.log(i);
				}, 1000*_timeout);
			})(range, i);

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