tv ratings web scraper
================

Simple web scraper to get information from http://www.mediaite.com/ rating pages

## Get links starting from page X
(/links/{start})
Fetching url links from http://www.mediaite.com/tag/cable-news-ratings/page/x to current page
Scraping links matching 'cable-rating' and storing them in urls.json in object with uTC date and url as key/value pair in an object

This will check all the files stored and create an obect to run through and store data, and once the data is fetched, we save the files from the url's start date parameter, outlined next.

### Populating data from urls
(/ratings/get/{YYYYMMDD}/{count})
Scraping each url for the ratings table (25-64 demographic) and storing the ratings in an object with network/ratingValues as key/value pairs in each file.
This url calls /ratings/{date} at an interval to store the data in the ratings folder into YYYYMMDD.json files.


Next up: fetching ratings data

You're welcome, Brian <3
