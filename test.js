var nano = require('nano')('http://localhost:5984');
const fs = require("fs");
const path = require("path");

var getSize = require('get-folder-size');

var db = nano.db.use('hmdb');

var sources = [
	"/Users/d051016/private"
];

var isTV = function(files) {
	var rEpisode = /e\d{2}\./i,
		iCount = 0;

	files.forEach(function(file) {
		if (rEpisode.test(file)) {
			iCount++;
		}
	});

	if (iCount >= 2) {
		return true;
	} else {
		return false;
	}
};

var hasSubDirectory = function(files, fullPath) {
	return files.some(function(file) {
		var stat = fs.statSync(path.join(fullPath, file));
		return stat.isDirectory();
	});
};

var processDir = function(source) {
	return function(name) {
		var fullPath = path.join(source, name);
		fs.stat(fullPath, function(error, stat) {
			if (stat.isDirectory()) {
				fs.readdir(fullPath, function(error, files) {
					var type;

					if (/s\d{2}(?:-s?\d{2})?/i.test(name)) {
						type = "tv";
					} else {
						type = isTV(files) ? "tv" : "movie";
					}

					var subDir = hasSubDirectory(files, fullPath);

					getSize(fullPath, function(err, size) {
						if (err) { throw err; }

						var key = name.toLowerCase();

						db.get(key, function(error, body) {
							var changeDetected = true;
							if (error && error.statusCode === 404) {
								db.insert({
									path: [source],
									type: type,
									name: name,
									size: [size],
									subDir: subDir
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
								} else if (type !== body.type) {
									body.type = type;
								} else if (subDir !== !!body.subDir) {
									body.subDir = subDir;
								} else {
									changeDetected = false;
								}

								if (changeDetected) {
									db.insert(body, function(error, body) {
										if (!error) {
											console.log("updated");
										}
									});
								} else {
									console.log("same as before");
								}
							}
						});
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
