var nano = require('nano')('http://192.168.0.5:5984');
var ncp = require('ncp').ncp;
ncp.limit = 16;
const fs = require("fs");
const path = require("path");
const util = require("util");

const db = nano.db.use('hmdb');

const fnpView = util.promisify(db.view);
const fnpAccess = util.promisify(fs.access);
const fnpNcp = util.promisify(ncp);

const targetFolder = "/mnt/dominik/";

fnpView("movieintv", "movie1").then(function(body) {
    return body.rows.reduce(function(pChain, row) {
        var path = targetFolder + row.key;

        return pChain.then(function() {
            return fnpAccess(path);
        }).then(function() {
            console.log("exists: " + path);
        }, function(error) {
            console.log("start copy: " + path);
            return fnpNcp(row.value, targetFolder).then(function() {
                console.log("end copy: " + path);
            });
        });
    }, Promise.resolve());
}).catch(function(error) {
    console.log("Error!!!");
    console.log(error);
});