var nodemailer = require('nodemailer'),
    Q = require('q'),
    jade = require('jade'),
    config = require('config');


var transport = {
    gmail : nodemailer.createTransport('SMTP', {
        host: 'smtp.gmail.com', // hostname
        secureConnection: true, // use SSL
        port: 465, // port for secure SMTP
        auth: {
            user: 'dispatch@i-x.it',
            pass: 'ydR<F4Z%',
        },
        debug: config.mail.debug
    }),
    postmark : nodemailer.createTransport('SMTP', {
        //service: 'Postmark',
        host: config.mail.postmark.host, // hostname
        //secureConnection: true, // use SSL
        port: 2525, // port for secure SMTP
        auth: {
            user: config.mail.postmark.username,
            pass: config.mail.postmark.password
        },
        debug: config.mail.debug,
        ignoreTLS: true

    }),
    // gmail : nodemailer.createTransport('SMTP', {
    //     service: 'Gmail',
    //     auth: {
    //         // user: 'dispatch@i-x.it',
    //         // password: 'ydR<F4Z%',
    //         user: 'michael.rhema@gmail.com',
    //         password: 'bluntrollingG.'
    //     }
    // }),

};

var mailer = {


    sendMail : function (options, service) {
        var mp = Q.defer();
        service = service || config.mail.defaultService;

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: config.mail.defaultSenderName + ' <' + config.mail.defaultSenderEmail + '>', // sender address
            to: options.to, // list of receivers
            subject: options.subject, // Subject line
            text: options.text // plaintext body
        };
        console.log(mailOptions);

        // send mail with defined transport object
        transport[service].sendMail(mailOptions, function(error, response){
            if(error){
                return mp.reject(error);
            }else{
                return mp.resolve(response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            //transport.close(); // shut down the connection pool, no more messages
        });

        return mp.promise;
    },

    sendHTMLMail : function (options, templatePath, templateData, service) {
        var mp = Q.defer();
        service = service || config.mail.defaultService;

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: config.mail.defaultSenderName + '<' + config.mail.defaultSenderEmail + '>', // sender address
            to: options.to, // list of receivers
            subject: options.subject, // Subject line
            html: jade.renderFile(templatePath, templateData) // plaintext body
        };

        // send mail with defined transport object
        transport[service].sendMail(mailOptions, function(error, response){
            if(error){
                return mp.reject(error);
            }else{
                return mp.resolve(response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            transport.close(); // shut down the connection pool, no more messages
        });

        return mp.promise;
    }
};


module.exports = mailer;