var nano = require('nano')('http://localhost:5984');
const fs = require("fs");
const path = require("path");

var getSize = require('get-folder-size');

getSize(myFolder, function(err, size) {
  if (err) { throw err; }

  console.log(size + ' bytes');
  console.log((size / 1024 / 1024).toFixed(2) + ' Mb');
});

var db = nano.db.use('hmdb');

var sources = [
	"/Users/d051016/private"
];

var processDir = function(source) {
	return function(name) {
		var fullPath = path.join(source, name);
		fs.stat(fullPath, function(error, stat) {
			if (stat.isDirectory()) {
				fs.readdir(fullPath, function(error, files) {
					var type;
					if (files.length > 8) {
						type = "tv";
					} else {
						type = "movie"
					}

					getSize(fullPath, function(err, size) {
						if (err) { throw err; }

						var key = name.toLowerCase();

						db.get(key, function(error, body) {
							if (error && error.statusCode === 404) {
								db.insert({
									path: [source],
									type: type,
									name: name,
									size: [size]
								}, key, function(error, response) {
									if (error) {
										console.log("something went wrong");
									} else {
										console.log(response);
									}
								});
							} else if (body) {
								if (body.path.indexOf(source) === -1) {
									body.path.push(source);
									body.size.push(size);

									db.insert(body, function(error, body) {
										if (!error) {
											console.log("updated");
										}
									})
								} else {
									console.log("same as before");
								}
							}
						});
					// console.log(size + ' bytes');
					// console.log((size / 1024 / 1024).toFixed(2) + ' Mb');
					});


				});
			}
		});
	};
};

sources.forEach(function(source) {
	fs.readdir(source, function(error, files) {
		files.forEach(processDir(source));
	});
});
