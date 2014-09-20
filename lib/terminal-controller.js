var menu = require('inquirer'),
    jf = require('jsonfile'),
    path = require('path'),
    fs = require('fs'),
    dot = require('dotject'),
    _ = require('lodash');

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

//Prompts for the values used to register a new service,
//using the properties
var srvc_prompt = function (srv, cb) {
  var q =  [
    {
      type: 'input',
      name: 'service_name',
      message: 'Service Name',
      default: function () { return srv.name; }
    },
    {
      type: 'input',
      name: 'service_desc',
      message: 'Service Description',
      default: function () { return srv.desc; }
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
    return str.split('.').reduce(function(o, x) { return o[x] }, obj);
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
 * displays the top menu choices based on the configuration object.
 * @return {[type]} [description]
 */
Gypsi.prototype.showTopMenu = function () {
  var self = this;
  var choices = [];
  if (_.size(self._currentConfiguration.main) === 0) {
    choices.unshift('Create A New Project');
  }

  if (_.size(self._currentConfiguration.main) > 0) {
    choices.unshift('Manage this Project', 'Run this Project');
  }
  choices.push(
    new menu.Separator(),
    'Quit'
  );

  menu.prompt([
    {
      type: 'list',
      name: 'topMenu',
      message: 'What do you want to do?',
      choices: choices
    }
  ], function( answers ) {
    switch(answers.topMenu) {
      case 'Create A New Project':
      self.createNewProject();
      break;
      case 'Manage this Project':
      break;
      case 'Run this Project' :
      break;
      default:
      process.exit(0);
      break;
    }
  });
};

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
 * config file '.gypsirc'
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
    self._currentConfiguration = cfg2write;
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
 * project and writes / saves it in the '.gypsirc'
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
        var na = jf.readFileSync(path.join(coAppAns.path, 'package.json'));

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

    function _askForAName () {
      var questions = [
        {
          type: 'input',
          name: 'serviceName',
          message: 'Name of Service',
        }
      ],
      cb = arguments[0] || null;

      menu.prompt( questions, function( coAppAns ) {
        var spawn = require('child_process').spawn,
            ps    = spawn('systemctl', ['list-unit-files']),
            grep  = spawn('grep', [coAppAns.serviceName]);

        ps.stdout.on('data', function (data) {
          grep.stdin.write(data);
        });

        ps.stderr.on('data', function (data) {
          console.log('ps stderr: ' + data);
        });

        ps.on('close', function (code) {
          if (code !== 0) {
            console.log('ps process exited with code ' + code);
          }
          grep.stdin.end();
        });

        grep.stdout.on('data', function (data) {
          if (data.toString().indexOf(coAppAns.serviceName + '.service') > -1) {
            cb(coAppAns);
          } else {
            console.log("Service %s not found", coAppAns.serviceName);
            _askForAName.call(null, cb);
          }
        });

        grep.stderr.on('data', function (data) {
          console.log('grep stderr: ' + data);
        });

        grep.on('close', function (code) {
          if (code !== 0) {
            // console.log('grep process exited with code ' + code);
            console.log("Service %s not found", coAppAns.serviceName);
            _askForAName.call(null, cb);
          }
        });

      });
    }

    if (coAppToDo.coApp === 'service') {

      _askForAName(function (isService) {
        srvc_prompt({
          name: isService.serviceName,
          //TODO::
          //will fetch service from  unit
          //file. later
          desc: ''
        }, function (ans){

          self.writeCfg(ans, 'coApps.services', function () {
            console.log('Configuration written');
            self.addCoApp();
          });
        });
      });
    }

    if (coAppToDo.coApp === 'abort') {
      self.showTopMenu();
    }
    // console.log( JSON.stringify(answers, null, '  ') );
  });
};

Gypsi.prototype.createNewProject = function createNewProject () {

  var self = this;
  var pkjson = jf.readFileSync(process.cwd() + '/package.json');

  pkg_prompt(pkjson, function (projectStartAnswers){
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
      self.writeCfg(writeThis, 'main', function () {
        console.log('Configuration written');
        self.addCoApp();
      });
    });
  });

};

Gypsi.prototype.manageProject = function manageProject () {
  var self = this;
  self._currentConfiguration = jf.readFileSync(self.gcfg);
  self.showTopMenu();
};

// va/r g = new Gypsi();

module.exports = Gypsi;
