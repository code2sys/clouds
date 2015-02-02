Parse.Cloud.define("lucky_numbers", function(request, response) {
});

/*
@param
limit (optional)
skip (optional)
*/
Parse.Cloud.define("draws_get_all", function(request, response) {

	Parse.Cloud.useMasterKey();

	var query = new Parse.Query('Draw');
	query.descending('createdAt');
	
	if (typeof request.params.limit !== "undefined")
		query.limit(request.params.limit);

	if (typeof request.params.skip !== "undefined")
		query.limit(request.params.skip);

	query.find().then(function(result) {

		response.success({
			'msg':'success',
			'result':result
		});

	}, function(error) {

		response.error(error);

	});

});

