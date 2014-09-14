var menu = require('inquirer'),
    jf = require('jsonfile'),
    path = require('path'),
    fs = require('fs'),
    spawnNode = require('child_process').spawn;

var _checkIfPkjExists = function (path, cb) {
  fs.open(path, 'r', function (err, b) {
    if (err.code === 'ENOENT') {
      return cb(false);
    } else {
      return cb(true);
    }
  });
};

var Gypsi = function (hasCfg) {
  var self = this;
  //node-gypsi config file
  self.gcfg = path.join(process.cwd() , '.gypsi');

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
    self._currentConfiguration = {};
  }
};

Gypsi.prototype.constructor = Gypsi;

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
 * @param  {[type]}   obj  The object to be saved in
 * @param  {[type]}   prop the property on the config file to save the object.
 * @param  {Function} cb   Call back to be executed when write operation is successful.
 * @return {[type]}        Function with no arguments
 */
Gypsi.prototype.writeCfg = function (obj, prop, cb) {
  var self = this;
  self._currentConfiguration[prop] = obj;
  jf.writeFile(self.gcfg, self._currentConfiguration, function (err) {
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
            _checkIfPkjExists(path.join(value, 'package.json'), function (d) {
              if (!d) {
                console.log('No package.json found in: ' + value);
                return self.addCoApp();
              }
              var na = require(path.join(value, 'package.json'));
            });


          }
        }
      ];

      menu.prompt( questions, function( answers ) {
        console.log( JSON.stringify(answers, null, '  ') );
      });
    }

    if (coAppToDo.coApp === 'abort') {
      process.exit(0);
    }
    // console.log( JSON.stringify(answers, null, '  ') );
  });
};

module.exports = function () {
  return {
    createNewProject: function () {
      var g = new Gypsi();

      var pkjson = require('../package.json');
      var questions = [
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

      menu.prompt( questions, function( projectStartAnswers ) {

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