
/*
@param
user (optional)
skip (optional)
limit (optional)

@return
{
	'friends' : friends (array of User)
	'sent' : invitation sent (array of Invitation)
	'received' : invitation received (array of Invitation)
}
*/

Parse.Cloud.define("friends_get", function(request, response) {

	Parse.Cloud.useMasterKey();
	var user;
	var friends = [];
	var received = [];
	var sent = [];

	Parse.Promise.as().then(function() {

		if (typeof request.params.user !== "undefined")
		{
			var query = new Parse.Query('User');
			query.equalTo('objectId', request.params.user);
			return query.first();
		}

		return Parse.Promise.as(request.user);

	}).then(function(u) {

		user = u;

		var relation = user.relation('friends');
		var query = relation.query();

		if (typeof request.params.limit !== "undefined")
			query.limit(request.params.limit);

		if (typeof request.params.skip !== "undefined")
			query.limit(request.params.skip);

		return query.find();

	}).then(function(results) {

		friends = results;

		if (user.id == request.user.id)
		{
			Parse.Promise.as().then(function() {
				var query = new Parse.Query('Invitation');
				query.equalTo('from', user);
				query.include('to');

				return query.find();

			}).then(function(results) {

				sent = results;

				var query = new Parse.Query('Invitation');
				query.equalTo('to', user);
				query.include('from');

				return query.find();
				
			}).then(function(results) {

				received = results;

				response.success({
					'msg':'success',
					'result':{
						'friends':friends,
						'sent':sent,
						'received':received
					}
				});

			}, function(error) {

				response.error(error);
				
			});
		}
		else
		{
			response.success({
				'msg':'success',
				'result':{
					'friends':friends
				}
			});
		}

	}, function (error) {
		response.error(error);
	});

});

/*
@param
invitation : invitation id
*/

Parse.Cloud.define('accept_invite', function(request, response) {

	Parse.Cloud.useMasterKey();
	var me = request.user;
	var person;
	var invitation_received;

	Parse.Promise.as().then(function() {

		var query = new Parse.Query('Invitation');
		query.equalTo('objectId', request.params.invitation);

		return query.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, the invitation not found.');
		});

	}).then(function(result) {

		person = result.get('from');

		return makeFriends(me, person);

	}).then(function(r) {

		response.success({
			'msg':'success'
		});
		
	}, function (error) {

		response.error(error);

	});
});



/*
@param
user : person to invite

@retrun
{
	msg : helpful message if result is nil
	result:invitation data
}
*/

Parse.Cloud.define("invite", function(request, response) {

	Parse.Cloud.useMasterKey();
	var me = request.user;
	var person;

	Parse.Promise.as().then(function() {

		var query = new Parse.Query('User');
		query.equalTo('objectId', request.params.user);
		return query.first().then(null, function(error) {
			return Parse.Promise.error('Sorry, user not found.');
		});

	}).then(function(result) {

		person = result;

		var relation = me.relation('friends');
		var query = relation.query();
		query.equalTo('objectId', person.id);
		return query.find();

	}).then(function(results)) {

		if (results.length > 0) // the person is friend
		{
			response.success({
				'msg':'You are friends already.'
			});
		}
		else
		{
			Parse.Promise.as().then(function() {

				var query = new Parse.Query('Invitation');
				query.equalTo('from', person);
				query.equalTo('to', me);
				return query.find();

			}).then(function(results) {

				if (results.length > 0) // the person has invited you already
				{
					// accept the invitation
					makeFriends(me, person).then(function(r){
						response.success({
							'msg':'Both of you invite each other, you are friends now.'
						});
					}, function(error) {
						response.error(error);
					});
				}
				else
				{
					invitePerson(me, person).then(function(r) {
						response.success({
							'msg':'success',
							'result' : r
						});
					}, function(error) {
						response.error(error);
					});
				}

			});
		}

	}, function(error) {
		response.error(error);
	});
});

var invitePerson = function(from, to) {
	return Parse.Promise.as().then(function() {

		var query = new Parse.Query('Invitation');
		query.equalTo('from', from);
		query.equalTo('to', to);
		return query.find();

	}).then(function(results) {

		if (results.length == 0)
		{
			var invitation = new Parse.Object('Invitation');
			invitation.set('from', from);
			invitation.set('to', to);
			return invitation.save();
		}

		//TODO: invitation email if needed

		return Parse.Promise.as(results[0]);
	});
}

var makeFriends = function(person1, person2) {

	return Parse.Promise.as().then(function() {
		var query1 = new Parse.Query('Invitation');
		query1.equalTo('from', person2);
		query1.equalTo('to', person1);

		var query2 = new Parse.Query('Invitation');
		query2.equalTo('from', person1);
		query2.equalTo('to', person2);

		var query = Parse.Query.or(query1, query2);
		return query.find();

	}).then(function(invitations) {

		var _ = require('underscore');
		var promises = [];
		_.each(invitations, function(invitation) {
			promises.push(invitation.destroy());
		});

		return Parse.Promise.when(promises);
		
	}).then(function() {

		var relation = person1.relation('friends');
		relation.add(person2);
		return person1.save();
		
	}).then(function(r) {

		var relation = person2.relation('friends');
		relation.add(person1);
		return person2.save();
		
	});
}