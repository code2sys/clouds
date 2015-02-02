
/*
@Params
	type : 0/1 (power ball/mega millions)
	draw : draw id
	group (optional) : group id
	tickets : array of tickets (each ticket is a set of numbers, last number is MEGA)

*/

Parse.Cloud.define("ticket_purchase", function(request, response) {

	Parse.Cloud.useMasterKey();

	var me = request.user;
	var type = request.params.type;
	var group = null;
	var tickets = new Array();

	Parse.Promise.as().then(function(result) {

		if (typeof request.params.draw !== "undefined")
		{
			var query = new Parse.Query('Draw');
			query.equalTo('objectId', request.params.draw);

			return query.first().then(null, function(error) {
				return Parse.Promise.error('Sorry, the lottery not found.');
			});
		}
		else
		{
			var query = new Parse.Query('Draw');
			query.equalTo('objectId', request.params.draw);
			query.equalTo('status', 0);
			query.equalTo('type', type);
			query.greaterThan('date', new Date());
			query.ascending('date');

			return query.first().then(null, function(error) {
				return Parse.Promise.error('Sorry, the lottery is not open yet. Please try again later.');
			});
		}

	}).then(function(result) {

		draw = result;

		if (draw == null)
			return Parse.Promise.error('Sorry, the lottery is not open yet. Please try again later.');

		if (typeof request.params.group !== "undefined") {

			var query = new Parse.Query('Group');
			query.equalTo('objectId', request.params.group);

			return query.first();
		}

		return Parse.Promise.as(null);

	}).then(function(result) {

		group = result;

		var _ = require('underscore');

		var promise = Parse.Promise.as("");

		_.each(request.params.tickets, function(pTicket) {

			promise = promise.then(function(r) {

				var ticket = new Parse.Object('Ticket');

				ticket.set("buyer", me);

				if (group !== null)
					ticket.set("buyer_group", group);

				ticket.set("mega", pTicket[pTicket.length - 1]);

				for (var i = 1; i < pTicket.length; i ++)
					ticket.set("number" + i, pTicket[i - 1]);

				return ticket.save();

			}).then(function(result){

				tickets.push(result);

				return Parse.Promise.as('');
			});

		});

		return promise;

	}).then(function(r) {

		var relation = draw.relation('tickets');
		relation.add(tickets);
		return draw.save();

	}).then(function(result) {

		response.success({
			'msg':'success',
			'result':{
				'tickets':tickets,
				'draw':draw
			}
		});

	}, function(error) {

		response.error(error);

	});

});

Parse.Cloud.define("ticket_get_mine", function(request, response) {

	Parse.Cloud.useMasterKey();

	var me = request.user;

	var query = new Parse.Query('Ticket');
	query.equalTo("buyer", me);
	query.doesNotExist("buyer_group");
	query.find().then(function(numbers) {

		response.success({
			'msg':'success',
			'result':numbers
		});

	}, function(error) {

		response.error(error);

	});

});

Parse.Cloud.define("ticket_get_group", function(request, response) {

	Parse.Cloud.useMasterKey();

	Parse.Promise.as().then(function() {
		// 1. fetch group

		var groupQuery = new Parse.Query('Group');
		groupQuery.equalTo('objectId', request.params.group);
		return groupQuery.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, the group not found.');
		});

	}).then(function(group) {

		var query = new Parse.Query('Ticket');
		query.equalTo("buyer", me);
		query.doesNotExist("buyer_group");
		return query.find();

	}).then(function(groups) {

		response.success({
			'msg':'success',
			'result':groups
		});

	}, function(error) {

		response.error(error);

	});

});