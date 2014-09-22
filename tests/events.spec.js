describe("Event Register", function(){

	var EventRegister = require('../../lib/event_register').register;
	var complete, result;

	beforeEach(function(){
		complete = false;
	});

	it("should correctly queue events", function(done){
		var eventRegister = new EventRegister();

		eventRegister.on('say', function(data, isDone){
			console.log('Say: %s',data);
			isDone(++data);
		});
		eventRegister.on('no', function(data, isDone){
			isDone(++data);
		});
		eventRegister.on('Ayy', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('Bee', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('Cee', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('complete', function(data, isDone){
			console.log('complete spoken');
			complete = true;
		});


			eventRegister
			.queue('Ayy', 'Bee', 'Cee')
			.beforeEach('say')
			.afterEach('no')
			.onError(function (err) {
				console.log(err);
			})
			.onEnd(function(r){
				result = r;
				expect(result).toBeDefined();
				expect(result).toEqual(10);
				done();
			})
			.start(1);

	});
	xit("should stop the queue when an error event occurs", function(){
		var eventRegister = new EventRegister();

		eventRegister.on('say', function(data, isDone){
			console.log('Say: %s',data);
			isDone(++data);
		});
		eventRegister.on('no', function(data, isDone){
			isDone(++data);
		});
		eventRegister.on('Ayy', function(data, isDone){
			isDone(new Error('Ayy throws error'));
		});

		eventRegister.on('Bee', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('Cee', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('complete', function(data, isDone){
			console.log('complete spoken');
			complete = true;
		});


		runs(function(){
			eventRegister
			.queue('Ayy', 'Bee', 'Cee')
			.beforeEach('say')
			.afterEach('no')
			.onError(function(err){
				console.log(err);
				result = err;
				complete = true;
			})
			.onEnd(function(r){
				result = r;
				complete = true;
			})
			.start(1);

		});

		waitsFor(function(){
			return complete;
		});

		runs(function(){
			expect(result).toBeDefined();
		});
	});
	xit("should throw an error when it finds missing listners", function(){
		var eventRegister = new EventRegister();

		eventRegister.on('say', function(data, isDone){
			console.log('Say: %s',data);
			isDone(++data);
		});
		eventRegister.on('no', function(data, isDone){
			isDone(++data);
		});
		eventRegister.on('Ayy', function(data, isDone){
			isDone(new Error('Ayy throws error'));
		});

		eventRegister.on('Bee', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('Cee', function(data, isDone){
			isDone(++data);
		});

		eventRegister.on('error', function(data, isDone){
			console.log('complete spoken');
			complete = true;
		});


		runs(function(){
			eventRegister
			.queue('Ayy', 'Bee', 'Cee')
			.beforeEach('say')
			.afterEach('no')
			// .onError(function(err){
			// 	console.log(err);
			// 	result = err;
			// 	complete = true;
			// })
			.onEnd(function(r){
				result = r;
				complete = true;
			})
			.start(1);

		});

		waitsFor(function(){
			return complete;
		});

		runs(function(){
			expect(result).toBeDefined();
		});
	});

});