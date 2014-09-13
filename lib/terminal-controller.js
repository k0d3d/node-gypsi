var menu = require('inquirer'),
    jf = require('jsonfile'),
    childNode = require('child_process').spawn,
    pkjson = require('../package.json');

var Gypsi = function (config) {

  this.timestampLastUpdate = Date.now();
  this.currentConfiguration = config;

};

Gypsi.prototype.constructor = Gypsi;

module.exports = function () {
  return {
    createNewProject: function () {

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
        var confirmationText = '';
        confirmationText += 'Project Name: ' + projectStartAnswers.project_name + '\n';
        confirmationText += 'Project Version: ' + projectStartAnswers.project_version + '\n';
        confirmationText += 'Project Entry Point: ' + projectStartAnswers.project_entry_point + '\n';

        console.log(confirmationText);

        menu.prompt([
          {
            type: 'expand',
            message: 'Are you sure? : ',
            name: 'yes',
            choices: [
              {
                key: 'y',
                name: 'Continue',
                value: 'true'
              },
              {
                key: 'n',
                name: 'Start all over',
                value: 'false'
              }
            ]
          }
        ], function( confirmedAns ) {
          var writeThis = {
            appDeets: {
              project_name: projectStartAnswers.project_name,
              project_version: projectStartAnswers.project_version,
              project_entry_point  : projectStartAnswers.project_entry_point
            }
          };
          console.log(process.cwd());

          var cfg = new Gypsi(writeThis);

          jf.writeFile('./.gypsirc', cfg.currentConfiguration, function (err) {
            if (err) {
              console.log(err);
              process.exit(1);
            }
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
            ], function( answers ) {
              console.log( JSON.stringify(answers, null, '  ') );
            });


          });


        });
      });

    }
  };
};