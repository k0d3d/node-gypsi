/**
 * @module lib
 * @submodule data
 * */
var mongoose = require("mongoose"),
    config = require("config"),
    Q = require("q");
    Q.longStackSupport = true;

var CONN_DISCONNECTED = 0,
    CONN_DISCONNECTING = 3,
    CONN_CONNECTED = 1;
    
/**
 * @class Database
 * */
var Database = {
    
    /**
     * Open a db connection
     * @method open
     * @param onSuccess {Function}
     * @param onError {Function}
     * */
    open: function() {

        var d = Q.defer();

        //Do not attempt to open an already opened database
        if (mongoose.connection === undefined || mongoose.connection.readyState === CONN_DISCONNECTED || mongoose.connection.readyState === CONN_DISCONNECTING) {
            var cnn = config.db;

            var server = cnn.server;
            var database = cnn.database;
            var port = cnn.port;
            var user = cnn.user;
            var password = cnn.password;

            var db = mongoose.connection;

            var dbURI;

            //If the post is not zero then append the port to the server name
            if (port > 0) {
                server = server + ':' + port;
            }

            if (user && password) {
              dbURI = 'mongodb://' + user + ':' + password + "@" + server + '/' + database;
            } else {
              dbURI = 'mongodb://' + server + '/' + database;
            }

            console.log('connecting to...' + dbURI);

            // Create the database connection
            mongoose.connect(dbURI);

            // CONNECTION EVENTS
            // When successfully connected
            db.on('connected', function() {
                console.log('Mongoose default connection open to ' + server + '/' + database);
                d.resolve();

            });

            // If the connection throws an error
            db.on('error', function(err) {
                console.log('Mongoose default connection error: ' + err);
                d.reject(err);

            });
            // When the connection is disconnected
            db.on('disconnected', function() {
                console.log('Mongoose default connection disconnected');
            });
            // If the Node process ends, close the Mongoose connection
            process.on('SIGINT', function() {
                db.close(function() {
                    console.log('Mongoose default connection disconnected through app termination');
                    process.exit(0);
                });
            });

        } else {
            d.resolve();
        }
        
        return d.promise;

    },

    //Expose this instance of mongoose so that it can be used when needed
    mongoose: mongoose,

    close: function() {

        mongoose.disconnect();

    }


};
module.exports = Database;