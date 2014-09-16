var menu = require('inquirer'),
    jf = require('jsonfile'),
    path = require('path'),
    fs = require('fs'),
    dot = require('dotject'),
    _ = require('lodash'),
    spawnNode = require('child_process').spawn;

var _checkIfPkjExists = function (path) {
  var openFile;
  try {
    openFile = fs.openSync(path, 'r');
    return true;
  } catch (e) {
    console.log('No package.json found in: ' + path);
    return false;
  }
};

//Prompts for the values used to register a new project,
//using the properties of a package.json file.
var pkg_prompt = function (pkjson, cb) {
  var q =  [
    {
      type: 'input',
      name: 'project_name',
      message: 'Project Name',
      default: function () { return pkjson.name; }
    },
    {
      type: 'input',
      name: 'project_version',
      message: 'Project Version',
      default: function () { return pkjson.version; }
    },
    {
      type: 'input',
      name: 'project_entry_point',
      message: 'Project Entry Point',
      default: function () { return pkjson.main; }
    }
  ];

  menu.prompt( q, function( projectStartAnswers ){
    return cb(projectStartAnswers);
  });
};

/**
 * Convert Javascript string in dot notation into an object reference
 * @param  {[type]} obj [description]
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
var strToObj = function strToObj (obj, str) {
    return str.split(".").reduce(function(o, x) { return o[x] }, obj);
};


var Gypsi = function (hasCfg) {
  var self = this;
  //node-gypsi config file
  self.gcfg = path.join(process.cwd() , '.gypsirc');

  if (hasCfg) {
    //check if a config file already exists
    jf.readFile(self.gcfg, function (err, f) {
      if (err) {
        process.stderr.write(err.message);
        console.log(err);
        process.exit(1);
      } else {
        self._currentConfiguration = f;
        console.log(self);
      }
    });
  } else {
    //probably new configuration should be created,
    //this should always hold the config
    self._currentConfiguration = {
      main: {},
      coApps: {
        node: {},
        services: {}
      }
    };
  }
};

Gypsi.prototype.constructor = Gypsi;

/**
 * Prompts the user to confirm the values read from
 * a package.json file for a Node Application.
 * @param  {Object}   pkjsonNfo package.json read in to an object
 * @param  {Function} cb        Function that accepts a boolean as an argument
 * @return {[type]}             Function
 */
Gypsi.prototype.preAddApp = function (pkjsonNfo, cb) {
        var confirmationText = '';
        confirmationText += 'Project Name: ' + pkjsonNfo.project_name + '\n';
        confirmationText += 'Project Version: ' + pkjsonNfo.project_version + '\n';
        confirmationText += 'Project Entry Point: ' + pkjsonNfo.project_entry_point + '\n';

        console.log(confirmationText);

        menu.prompt([
          {
            type: 'expand',
            message: 'Are you sure? : ',
            name: 'writePkjCfg',
            choices: [
              {
                key: 'y',
                name: 'Continue',
                value: true
              },
              {
                key: 'n',
                name: 'Not Sure',
                value: false
              }
            ]
          }
        ], function (hmmn) {
          return cb(hmmn);
        });
};

/**
 * writes the current configuration to the
 * config file ".gypsirc"
 * @param  {Object}   obj  The object to be saved / written in to a config property.
 * @param  {String}   prop the property on the config file to save the object. If the string
 * provided contains a dot, the string is parsed an converted to an object reference.
 * @param  {Function} cb   Call back to be executed when write operation is successful.
 * @return {[type]}        Function with no arguments
 */
Gypsi.prototype.writeCfg = function (obj, prop, cb) {
  var self = this,
      cfg2write;

  if (prop.indexOf('.') > -1) {
    //i use this to always append the new object
    //using numbers as the keys allows sorting
    //and the
    cfg2write = dot(prop + '.' + parseInt(_.size(strToObj(self._currentConfiguration, prop)) + 1), self._currentConfiguration, obj);
  } else {
    self._currentConfiguration[prop] = obj;
    cfg2write = self._currentConfiguration;
  }
  jf.writeFile(self.gcfg, cfg2write, function (err) {
    if (err) {

      //for now just exit..
      console.log(err);
      process.exit(1);
    }

    return cb();
  });
};

/**
 * adds a co-application or service to this
 * project and writes / saves it in the ".gypsirc"
 */
Gypsi.prototype.addCoApp = function () {

  var self = this;
  //now to add some service dependecies or co-application...
  menu.prompt([
    {
      type: 'expand',
      message: 'Add a co-application: ',
      name: 'coApp',
      choices: [
        {
          key: 'n',
          name: 'Node Application',
          value: 'node'
        },
        {
          key: 's',
          name: 'Service / Deamon',
          value: 'service'
        },
        new menu.Separator(),
        {
          key: 'x',
          name: 'Abort',
          value: 'abort'
        }
      ]
    }
  ], function( coAppToDo ) {

    if (coAppToDo.coApp === 'node') {

      var questions = [
        {
          type: 'input',
          name: 'path',
          message: 'Full path to Node App',
          validate: function( value ) {
            //try and read the package.json file
            //for this app.
            if (_checkIfPkjExists(path.join(value, 'package.json'))) {
              return true;
            } else  {

              return false;
            }

          }
        }
      ];

      menu.prompt( questions, function( coAppAns ) {
        var na = require(path.join(coAppAns.path, 'package.json'));

        pkg_prompt(na, function (projectStartAnswers){
          self.preAddApp(projectStartAnswers, function (so) {
            if (!so.writePkjCfg) {
              console.log('You can start again');
              process.exit(0);
            }
            var writeThis = {
                project_name: projectStartAnswers.project_name,
                project_version: projectStartAnswers.project_version,
                project_entry_point  : projectStartAnswers.project_entry_point
            };
            self.writeCfg(writeThis, 'coApps.node', function () {
              console.log('Configuration written');
              self.addCoApp();
            });
          });
        });

        //confirm if the package data is correct.
        // self.preAddApp(na, function () {
          // self.writeCfg()
        // });
        // console.log( JSON.stringify(coAppAns, null, '  ') );
      });
    }

    if (coAppToDo.coApp === 'abort') {
      process.exit(0);
    }
    // console.log( JSON.stringify(answers, null, '  ') );
  });
};

module.exports.gypsi = Gypsi;

module.exports.term = function () {
  return {
    createNewProject: function () {
      var g = new Gypsi();

      var pkjson = require('../package.json');

      pkg_prompt(pkjson, function (projectStartAnswers){
        g.preAddApp(projectStartAnswers, function (so) {
          if (!so.writePkjCfg) {
            console.log('You can start again');
            process.exit(0);
          }
          var writeThis = {
              project_name: projectStartAnswers.project_name,
              project_version: projectStartAnswers.project_version,
              project_entry_point  : projectStartAnswers.project_entry_point
          };
          g.writeCfg(writeThis, 'main', function () {
            console.log('Configuration written');
            g.addCoApp();
          });
        });
      });

    }
  };
};