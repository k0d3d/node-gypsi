#!/usr/bin/env node

/**
 * Module dependencies.
 */
/*
Main application entry point
 */

// pull in the package json
var pjson = require('./package.json');
console.log('gypsi application deamon manager: ' + pjson.version);

// REQUIRE SECTION
var express = require('express'),
    app = express(),
    errors = require('./lib/errors'),
    Menu = require('./lib/terminal-controller'),
    crashProtector = require('common-errors').middleware.crashProtector,
    fs = require('fs'),
    path = require('path'),
    Q = require('q');

Q.longStackSupport = true;

//color  on console output
require('colors');
// set version
app.set('version', pjson.version);

// port

function afterResourceFilesLoad() {

    console.log('configuring application, please wait...');

    app.set('showStackError', true);

    console.log('Enabling crash protector...');
    app.use(crashProtector());

    console.log('Enabling error handling...');
    app.use(errors.init());

    //run the terminal controller
    fs.open(path.join(process.cwd() , '.gypsirc'), 'r', function (err, b) {
      var terminal = new Menu();

      if (b) {
        return terminal.manageProject();
      }

      if (err.code === 'ENOENT') {
        terminal.createNewProject();
      }

      // process.stderr.write('Unknown Error Occurred');
      // process.exit(1);
    });
}

afterResourceFilesLoad();

// expose app
exports = module.exports = app;
// CATASTROPHIC ERROR
app.use(function(err, req, res){

  console.error(err.stack);

  // make this a nicer error later
  res.send(500, 'Ewww! Something got broken on IXIT. Getting some tape and glue');

});
