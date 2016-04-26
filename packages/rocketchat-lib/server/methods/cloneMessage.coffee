Meteor.methods
	cloneMessage: (message, options) ->
		if message.msg?.length > RocketChat.settings.get('Message_MaxAllowedSize')
			throw new Meteor.Error 400, '[methods] sendMessage -> Message size exceed Message_MaxAllowedSize'

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		user = RocketChat.models.Users.findOneById Meteor.userId(), fields: username: 1

		room = Meteor.call 'canAccessRoom', message.rid, user._id

		if not room
			return false

		if user.username in (room.muted or [])
			RocketChat.Notifications.notifyUser Meteor.userId(), 'message', {
				_id: Random.id()
				rid: room._id
				ts: new Date
				msg: TAPi18n.__('You_have_been_muted', {}, user.language);
			}
			return false

		#RocketChat.sendMessage user, message, room, options
		message.u = _.pick user, ['_id','username']

		message.rid = room._id

		if message.parseUrls isnt false
			if urls = message.msg.match /([A-Za-z]{3,9}):\/\/([-;:&=\+\$,\w]+@{1})?([-A-Za-z0-9\.]+)+:?(\d+)?((\/[-\+=!:~%\/\.@\,\w]+)?\??([-\+=&!:;%@\/\.\,\w]+)?(?:#([^\s\)]+))?)?/g
				message.urls = urls.map (url) -> url: url

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		if message._id? and options?.upsert is true
			RocketChat.models.Messages.upsert {_id: message._id}, message
		else
			message._id = RocketChat.models.Messages.insert message

		#luwei: becuz findVisibleCreatedOrEditedAfterTimestamp observe only added or changed after current time, we need this 'update' to chaneg the temp display of newly inserted message
		message.editedAt = new Date()
		message.editedBy = _.pick user, ['_id','username']

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		tempid = message._id
		delete message._id

		RocketChat.models.Messages.update
			_id: tempid
		,
			$set: message

		###
		Defer other updates as their return is not interesting to the user
		###
		Meteor.defer ->
			# Execute all callbacks
			RocketChat.callbacks.run 'afterSaveMessage', message, room

		return message

# Limit a user to cloning 5 msgs/second
DDPRateLimiter.addRule
	type: 'method'
	name: 'cloneMessage'
	userId: (userId) ->
		return RocketChat.models.Users.findOneById(userId)?.username isnt RocketChat.settings.get('RocketBot_Name')
, 5, 1000
