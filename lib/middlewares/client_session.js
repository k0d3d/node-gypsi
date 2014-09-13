var common = require('../commons.js'),
		bcrypt = require('bcrypt'),
		EventRegister = require('../event_register').register,
		config = require('config'),
		crypto = require('crypto'),
		rest = require('restler'),
		util =require('util');
var moment = require('moment');


module.exports = function(req, res, next){
	var eventRegister = new EventRegister();

	var thisSessionKey = common.uid(8);

	var params = {
		data:{
			x_date: Date.now(),
			client_session: bcrypt.genSaltSync(10),
			appID: config.appID,
			session_key: thisSessionKey
		}
	};	

	//Hash the date, appId and appSecret
	var sha256 = crypto.createHash('sha256');
	sha256.update(params.data.x_date+'/n'+params.data.appID+'/n'+config.appSecret, 'utf8');//utf8 here
	var resultHash = sha256.digest('base64');

	//Sign hash event using bcrypt
	eventRegister.on('signHash', function(data, isDone){
		bcrypt.hash('resultHash', params.data.client_session, function(err, hash){
			if(err){
				isDone(new Error(err));
			}else{
				isDone(hash);
			}
		});
	});

	//Post the params
	eventRegister.on('postHash', function(data, isDone){

		rest.post(config.api_url+'/clients/session',common.restParams(data))
		.on('complete', function(d){
			if(util.isError(d)){
				//send a new error to terminate the process
				isDone( new Error(d));
			}else{
				isDone(d);
			}
		});

	});

	//Begin the events stuff
	eventRegister
	.queue('postHash', 'signHash')
	.onEnd(function(data){
		req.client_session = params.data;
		res.set({
			'X-Session-Token': encodeURIComponent(data)
		});
		res.cookie('csid', thisSessionKey, { maxAge: 15 * 60 * 1000, httpOnly: true});		
		next();

	})
	.onError(function(err){
		util.puts(err);
		next();
	})
	.start(params);
};