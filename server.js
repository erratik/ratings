var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();
var moment = require('moment');
var jsonfile = require('jsonfile');
var util = require('util');
var morgan = require('morgan');             // log requests to the console (express4)

app.use(morgan('dev'));                                         // log every request to the console

var urls = {};
var urlFile = 'urls.json';
jsonfile.readFile(urlFile, function(err, obj) {
    // console.dir(obj)
    urls = obj;
});

app
	.get('/links/:start', function(req, res) {
	    var start = req.params.start;
	    for (var i = start; i > 0; i--) {
	        console.log(i);
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
	.get('/ratings/:date', function(req, res) {
		console.log(urls[req.params.date]);
	    request(urls[req.params.date], function(error, response, html) {
	        if (!error) {
	            var $ = cheerio.load(html);

	            $('table.ratings').last().filter(function() {
	                    var data = $(this);
	                // res.send(data);

	               res.send($(this).html());
	            });
	        }
	        // fs.writeFile('urls.json', JSON.stringify(urls, null, 4), function(err) {
	        //     console.log('File successfully written! - Check your project directory for the output.json file');
	        // });
	    });
	})
app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;