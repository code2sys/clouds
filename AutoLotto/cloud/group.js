
Parse.Cloud.define("group_list", function(request, response) {

	Parse.Cloud.useMasterKey();

	var me = request.user;

	var groupQuery = new Parse.Query('Group');
	groupQuery.equalTo("members", me);

	groupQuery.find().then(function(result) {

		response.success(result);

	}, function(error) {

		response.error(error);

	});
});


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

		return response.success("");

	}, function(error) {

		return response.error(error);

	});

});

Parse.Cloud.define("group_create", function(request, response) {
});

