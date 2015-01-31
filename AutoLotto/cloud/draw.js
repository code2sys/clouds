Parse.Cloud.define("lucky_numbers", function(request, response) {
});

Parse.Cloud.define("draws_get", function(request, response) {

	Parse.Cloud.useMasterKey();

	var groupQuery = new Parse.Query('Draw');
	groupQuery.descending('createdAt');
	groupQuery.skip(request.params.skip);
	groupQuery.limit(request.params.limit);

	groupQuery.find().then(function(result) {

		response.success(result);

	}, function(error) {

		response.error(error);

	});

});

