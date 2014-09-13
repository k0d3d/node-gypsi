/**
 * Module Dependencies
 */
var Hashid = require("hashids");
var hashHex = new Hashid("4knr3db0n3bi7hc");
var hashIntger = new Hashid("i4md4hm0d4k4h8n1", 8);


/**
 * [hashOid convert an objectId to a hash]
 * @param  {[type]} hex [description]
 * @return {[type]}     [description]
 */
exports.hashOid = function(hex){
	return hashHex.encryptHex(hex);
};

/**
 * [unhashOid convert a hash back to an ObjectID]
 * @param  {[type]} hash [description]
 * @return {[type]}      [description]
 */
exports.unhashOid = function(hash){
	var l = hashHex.decryptHex(hash);
	return l;
};

/**
 * [hashInt convert an integer to a 8 character hash]
 * @param  {[type]} int [description]
 * @return {[type]}     [description]
 */
exports.hashInt = function(int){
	var x = parseInt(int, 10);
	return hashIntger.encrypt(x);
};

/**
 * [unhashInt convert an 8 char hash back to an integer]
 * @param  {[type]} hash [description]
 * @return {[type]}      [description]
 */
exports.unhashInt = function(hash){
	var l = hashIntger.decrypt(hash);
	return l[0];
};