Meteor.methods
	pinMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] pinMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowPinning'
			throw new Meteor.Error 'message-pinning-not-allowed', '[methods] pinMessage -> Message pinning not allowed'

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			RocketChat.models.Messages.cloneAndSaveAsHistoryById message._id

		me = RocketChat.models.Users.findOneById Meteor.userId()

		message.pinned = true
		message.pinnedAt = Date.now
		message.pinnedBy =
			_id: Meteor.userId()
			username: me.username

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		RocketChat.models.Messages.setPinnedByIdAndUserId message._id, message.pinnedBy, message.pinned

		#luwei removes becuz it's too noisy
		# RocketChat.models.Messages.createWithTypeRoomIdMessageAndUser 'message_pinned', message.rid, '', me,
		# 	attachments: [
		# 		"text" : message.msg
		# 		"author_name" : message.u.username,
		# 		"author_icon" : getAvatarUrlFromUsername(message.u.username)
		# 	]

	unpinMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] unpinMessage -> Invalid user")

		if not RocketChat.settings.get 'Message_AllowPinning'
			throw new Meteor.Error 'message-pinning-not-allowed', '[methods] pinMessage -> Message pinning not allowed'

		# If we keep history of edits, insert a new message to store history information
		if RocketChat.settings.get 'Message_KeepHistory'
			RocketChat.models.Messages.cloneAndSaveAsHistoryById message._id

		me = RocketChat.models.Users.findOneById Meteor.userId()

		message.pinned = false
		message.pinnedBy =
			_id: Meteor.userId()
			username: me.username

		message = RocketChat.callbacks.run 'beforeSaveMessage', message

		RocketChat.models.Messages.setPinnedByIdAndUserId message._id, message.pinnedBy, message.pinned


		# Meteor.defer ->
		# 	RocketChat.callbacks.run 'afterSaveMessage', RocketChat.models.Messages.findOneById(message.id)
