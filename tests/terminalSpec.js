describe('Terminal Prompts and Methods', function() {
  var G = require('../lib/terminal-controller').gypsi,
      _ = require('lodash');

  var testCfgO = {
    project_name: 'Test Project',
    project_version: '0.0.1',
    project_entry_point: 'server.js'
  };

  xit ('should write dot notation config to an objects property', function (done) {
    var g = new G();
    g.gcfg = 'testrc';

    g.writeCfg(testCfgO, 'coApps.node', function () {
      expect(_.size(g._currentConfiguration.coApps.node)).toBeGreaterThan(0);
      done();
    });
  });

  it('should show the top menu with conditional choices', function (done) {
    console.log('as a new project');
    var g = new G();
    // g.showTopMenu();

    g.writeCfg(testCfgO, 'main', function () {
      console.log('as an exisiting project');
      g.showTopMenu();
      // expect(_.size(g._currentConfiguration.coApps.node)).toBeGreaterThan(0);
      // done();
    });
  },20000);
});