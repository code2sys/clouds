/*
@param
skip (optional)
limit (optional)
*/


Parse.Cloud.define("group_list", function(request, response) {

	Parse.Cloud.useMasterKey();

	var me = request.user;

	var groupQuery = new Parse.Query('Group');
	groupQuery.equalTo("members", me);

	if (typeof request.params.limit !== "undefined")
		groupQuery.limit(request.params.limit);

	if (typeof request.params.skip !== "undefined")
		groupQuery.limit(request.params.skip);

	groupQuery.find().then(function(results) {

		response.success({
			'msg':'success',
			'result':results
		});

	}, function(error) {

		response.error(error);

	});
});

/*
@param
group : group id

@return
{
	'member_count':numberOfMembers,
	'ticket_count':numberOfTickets,
	'draw_count':numberOfDraws
}
*/

// number of members
// number of tickets
// number of draws

Parse.Cloud.define("group_detail", function(request, response) {

	Parse.Cloud.useMasterKey();

	var me = request.user;
	var group;
	var numberOfMembers = 0;
	var numberOfTickets = 0;
	var numberOfDraws = 0;

	Parse.Promise.as().then(function() {

		var groupQuery = new Parse.Query('Group');
		groupQuery.equalTo('objectId', request.params.group);

		return groupQuery.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, the group not found.');
		});

	}).then(function(g) {

		group = g;

		var memberQuery = group.relation('members');

		return memberQuery.count().then(null, function(error) {
			return Parse.Promise.as(0);
		});

	}).then(function(result) {

		numberOfMembers = result;

		var ticketQuery = new Parse.Query('Ticket');
		ticketQuery.equalTo('buyer_group', group);

		return ticketQuery.count().then(null, function(error) {
			return Parse.Promise.as(0);
		});

	}).then(function(result) {

		numberOfTickets = result;

		var innerQuery = new Parse.Query('Ticket');
		innerQuery.equalTo('buyer_group', group);

		var drawQuery = new Parse.Query('Draw');
		drawQuery.matchesQuery('tickets', innerQuery);

		return drawQuery.count().then(null, function(error) {
			return Parse.Promise.as(0);
		});

	}).then(function(result){

		numberOfDraws = result;

		response.success({
			'msg':'success',
			'result':{
				'member_count':numberOfMembers,
				'ticket_count':numberOfTickets,
				'draw_count':numberOfDraws
			}
		});

	}, function(error) {
		response.error(error);
	});

});


/*

@param
group : group id

*/

Parse.Cloud.define("group_join", function(request, response) {

	Parse.Cloud.useMasterKey();

	var me = request.user;

	Parse.Promise.as().then(function() {
		// 1. fetch group

		var groupQuery = new Parse.Query('Group');
		groupQuery.equalTo('objectId', request.params.group);

		return groupQuery.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, the group not found.');
		});

	}).then(function(group) {

		var relation = group.relation('members');
		relation.add(me);

		return group.save().then(null, function(error) {


			console.log("Unexpected error" + error);

			return Parse.Promise.error('Sorry, unable to complete the request.');

		});

	}).then(function(result) {

		return response.success({
			'msg':'success',
		});

	}, function(error) {

		return response.error(error);

	});

});

