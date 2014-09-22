/**
* @module lib
* */
var events = require("events");
var util = require("util");
var _ = require('lodash');

var EventRegister = function(){
  events.EventEmitter.call(this);

  //Holds the number of events
  this.noOfEvents = 0;

  //Holds the list of events in an array
  this.listOfEvents =[];

  //Hold the current recursive events in an array
  this.recursiveEvents = [];

  //Holds the event Data
  this.eventData = '';

  var __queue = [], __beforeEachQueue ,__afterEachQueue;

  var __compileEvents = function(cb){
    var e = this;
    //List of Event Listeners
    var subscription = _.keys(e._events);


    for (var i = 0; i < __queue.length; i++) {
      //push in before
      if(__beforeEachQueue){
        e.listOfEvents.push(__beforeEachQueue);
      }

      //push in event
      e.listOfEvents.push(__queue[i]);

      //push in after
      if(__afterEachQueue){
        e.listOfEvents.push(__afterEachQueue);
      }
    }

    //Check for missing listeners
    _.each(e.listOfEvents, function(v){
      if(_.indexOf(subscription, v) === -1){
        __error.call(e, new Error('Missing Listener : '+ v));
      }
    });

    //Check for onComplete handler
    if(_.indexOf(subscription, 'complete') === -1 && _.isUndefined(e.__onCompleteExec)){
      console.log(e._events.keys);
      console.log(_.indexOf(subscription, 'complete') === -1 , _.isUndefined(e.__onCompleteExec));
      __error.call(e, new Error('Missing onComplete Listener'));
    }

    //Check for onError handler
    if(_.indexOf(subscription, 'error') === -1 && _.isUndefined(e.__onErrorExec)){
      e.__onErrorExec = function(err){
        util.puts(err);
      };
      __error.call(e, new Error('Missing onError Listener'));
    }
    cb();

  };

  var __onComplete = function(data){
    var self = this;
    if(_.isUndefined(this.__onCompleteExec)){
      self.emit('complete', data);
    }else{
      this.__onCompleteExec(data);
      //self.emit('complete', data);
    }
  };

  var __error = function(err){
    var self = this;

    self.noOfEvents = 0;
    if(_.isUndefined(this.__onErrorExec)){
      self.emit('error', err);
    }else{
      this.__onErrorExec(err);
      //self.emit('complete', data);
    }
  };


  /**
   * @queue method
   * @param  {String, Array} thaEvents [description]
   * @return {Object} EventRegister instance
   */
  this.queue = function(thaEvents){
    this.noOfEvents = arguments.length;
    var self = this;
    if(_.isArray(thaEvents)){
      _.each(thaEvents, function(v){
        __queue.push(v);
      });
    }else{
      for (var i = 0; i < arguments.length; i++) {
        if(_.isString(arguments[i])){
          __queue.push(arguments[i]);
        }
      }
    }

    return self;
  };

  this.until = function(data, thaEvents, cb){
    var self = this;

    var l = data.length, count= 0;

    //TODO:: make this a flexible method, if possible
    //private
    var isDone = function(r) {
      if (util.isError(r)) {
        return cb(r);
        //return __error.call(self, r);
      }

      //Check if there's a next event to
      //process the data
      if(self.recursiveEvents.length > 0){
        //Pass it to the next event
        return _nextEventUntil(r);
      }

      //If theres no other event,
      //it means we're done with one iteration.
      //lets check if there is still data to be process
      if(data.length > 0){
        return _nextDataUntil();
      }

      //If we get to this point, we're
      //done looping the data thru recursive events.
      //So lets callback
      cb(r, count);


    };

    function _nextEventUntil (record){
      //removes the first item off thaEvents as current
      var currentEvent = self.recursiveEvents.shift();

      self.emit(currentEvent, record, isDone);
    }

    function _nextDataUntil (){
      //Copy the events into recursiveEvents
      self.recursiveEvents = _.clone(thaEvents);

      //Removes the first item off data for processing
      var record = data.shift();

      count++;
      //Pass it into _nextEventUntil
      _nextEventUntil(record);
    }

    //Call _nextDataUntil to start
    _nextDataUntil();
  };

  /**
   * @beforeEach method
   * @param  {String, Array} thaEvents [description]
   * @return {Object} EventRegister instance
   */
  this.beforeEach = function (thaEvent){
    this.noOfEvents = arguments.length;
    var self = this;
    if(_.isString(thaEvent)){
      __beforeEachQueue = thaEvent;
    }
    return self;
  };
  /**
   * @afterEach method
   * @param  {String, Array} thaEvents [description]
   * @return {Object} EventRegister instance
   */
  this.afterEach = function (thaEvent){
    var self = this;
    if(_.isString(thaEvent)){
      __afterEachQueue = thaEvent;
    }
    return self;
  };



  this.onError = function(exec){
    this.__onErrorExec = exec;
    return this;
  };

  this.pause = function(lunchEvent){
    return true;
  };

  this.start = function(eventData){
    var self = this;

    self.eventData = eventData;
    //Start compiling the list of events
    __compileEvents.call(self, function(){

      //Dont do anything cuz errors from above
      //self.noOfEvents will b set to 0 by __error.
      if(self.noOfEvents === 0) return false;

      //set the number of events
      self.noOfEvents = self.listOfEvents.length;



      var isDone = function(r, detour) {
        if (util.isError(r)) {
          return __error.call(self, r);
        }else {

         __init(r);
        }
      };

      var __init = function(data){
        //console.log('No of events: %s', self.noOfEvents);
        if(self.noOfEvents--){
          var currentEvent = self.listOfEvents.shift();
          //console.log('Current Event: %s',currentEvent);
          //console.log('No of Events: %s', self.noOfEvents);
          //Pass in self as the event register instance / third argument
          self.emit(currentEvent, data || self.eventData, isDone, self);
        }else{
          //console.log('No of Events: %s', self.noOfEvents);
          __onComplete.call(self, data);
        }
      };

      __init();
    });
    return this;
  };



  this.onEnd = function(exec){
    this.__onCompleteExec = exec;
    return this;
  };


};

util.inherits(EventRegister, events.EventEmitter);

module.exports.register = EventRegister;