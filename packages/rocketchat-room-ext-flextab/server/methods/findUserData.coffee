Meteor.methods
	findUserData:(usernames) ->
		unless @userId
			return @ready()

		fields =
			_id: 1
			name: 1
			username: 1
			utcOffset: 1

		options =
			fields: fields
			sort: { username: 1 }
		
		unless usernames instanceof Array
			usernames = [usernames]

		query =
			username:
				$exists:true
			username:
				{$in:usernames}

		users = RocketChat.models.Users.find(query, options).fetch()
		#console.log users
		return users
