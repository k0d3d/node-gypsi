var 
    LocalStrategy = require('passport-local').Strategy,
    // BasicStrategy = require('passport-http').BasicStrategy,
    // ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy,
    // BearerStrategy = require('passport-http-bearer').Strategy,
    passport = require('passport'),
    // OAuth2 = require('../../models/oauth2'),
    User = require('../../models/user'),
    hashr = require('../hash.js');


module.exports = function() {

    // Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
    passport.ensureAuthenticated = function ensureAuthenticated(req, res, next) {

      if (req.isAuthenticated()) { 
        res.cookie('throne',hashr.hashOid(req.session.passport.user), {maxAge: 24 * 60 * 60 * 1000, httpOnly: false});
        console.log('yes is');
        return next(); 
      }
      res.redirect('#/login');
    };
 
    // Check for admin middleware, this is unrelated to passport.js
    // You can delete this if you use different method to check for admins or don't need admins
    passport.ensureAdmin = function ensureAdmin(req, res, next) {
      if(req.user && req.user.admin === true)
        next();
      else
        res.send(403);
    };

    passport.serializeUser(function(user, done) {
        console.log('Serializing User');
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        console.log('Deserializing');
        var user = new User();
        user.findUserObject({
            userId: id
        }).then(function(r) {
            done(null, r);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    }, function(req, email, password, done) {
        console.log('in ixit local strategy');

        var user = new User();

        user.checkAuthCredentials(email, password, req).then(function(r) {
            console.log('Received user Info');
            //Expects the user account object
            return done(null, r);
        }, function(err) {
            console.log('user credentials were not valid');
            //return done(err)
            // we don't need to return the specific error here, just that there was an error
            return done(null);
        });

    }));


    /**
     * BasicStrategy & ClientPasswordStrategy
     *
     * These strategies are used to authenticate registered OAuth clients.  They are
     * employed to protect the `token` endpoint, which consumers use to obtain
     * access tokens.  The OAuth 2.0 specification suggests that clients use the
     * HTTP Basic scheme to authenticate.  Use of the client password strategy
     * allows clients to send the same credentials in the request body (as opposed
     * to the `Authorization` header).  While this approach is not recommended by
     * the specification, in practice it is quite common.
     */
    // passport.use(new BasicStrategy(

    // function(username, password, done) {

    //     console.log(username, password);
    //     var oauth2 = new OAuth2();

    //     oauth2.findClient({
    //         key: username
    //     }).then(function(client) {
    //         //If client not found
    //         if (!client) {
    //             return done(null, false);
    //         }
    //         //If client found but password mismatch
    //         if (client.clientSecret != password) {
    //             return done(null, false);
    //         }
    //         //All good proceed
    //         return done(null, client);

    //     }, function(err) {
    //         //Error occurs with query
    //         if (err) {
    //             return done(err);
    //         }
    //     });
    // }));

    // passport.use(new ClientPasswordStrategy(

    // function(clientId, clientSecret, done) {
    //     var oauth2 = new OAuth2();

    //     oauth2.findClient({
    //         key: clientId
    //     }).then(function(client) {
    //         //If client not found
    //         if (!client) {
    //             return done(null, false);
    //         }
    //         //If client found but password mismatch
    //         if (client.clientSecret != clientSecret) {
    //             return done(null, false);
    //         }
    //         //All good proceed
    //         return done(null, client);

    //     }, function(err) {
    //         //Error occurs with query
    //         if (err) {
    //             return done(err);
    //         }
    //     });

    // }));

    /**
     * BearerStrategy
     *
     * This strategy is used to authenticate users based on an access token (aka a
     * bearer token).  The user must have previously authorized a client
     * application, which is issued an access token to make requests on behalf of
     * the authorizing user.
     */
    // passport.use(new BearerStrategy(

    // function(accessToken, done) {
    //     console.log('Using Bearer Strategy');
    //     var oauth2 = new OAuth2();
    //     oauth2.findToken(accessToken).then(function(token) {
    //         if (!token) {
    //             console.log('no token found :(');
    //             return done(null, false);
    //         }
    //         console.log('success! token found');

    //         //Find user info
    //         /* DIRECT METHOD
    //   var user = new User();
    //   user.findUser({ userId : token.user })
    //   .then(function (r) {
    //     if (!r) {
    //       return done(null, false);
    //     }
    //     var info = {scope: '*'};
    //     done(null, r, info);
    //     */
    //         console.log('before fetch of user information');
    //         /** USING BNC PERSON SVC */
    //         bncPersonSvc.fetchUserInformation(token.user).then(function(r) {

    //             function isValidJSON(input) {

    //                 if (/^[\],:{}\s]*$/.test(input.replace(/\\["\\\/bfnrtu]/g, '@').
    //                 replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
    //                 replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

    //                     //the json is ok
    //                     return true;
    //                 }
    //                 else {

    //                     //the json is not ok
    //                     return false;
    //                 }

    //             }

    //             console.log('finished fetching user information');
    //             console.log(r);
                
    //             if (r === null || !isValidJSON(r)) {

    //                 // for some reason the person service did not find the user so fallback to our own

    //                 var user = new User();
    //                 user.findUser({
    //                     userId: token.user
    //                 }).then(function(r) {
    //                     console.log('in fallback - could not retrieve from bnc person service - user information retrieved from internal db follows:');
    //                     console.log(r);
    //                     if (!r) {
    //                         return done(null, false);
    //                     }
    //                     var info = {
    //                         scope: '*'
    //                     };
    //                     done(null, r, info);
    //                 }, function(err) {
    //                     return done(err);
    //                 });
    //             }
    //             else {

    //                 if (!r) {
    //                     return done(null, false);
    //                 }
    //                 var info = {
    //                     scope: '*'
    //                 };
    //                 done(null, r, info);
    //             }
    //         }, function(err) {
    //             return done(err);
    //         });

    //     }, function(err) {
    //         if (err) {
    //             return done(err);
    //         }
    //     });

    // }));

};