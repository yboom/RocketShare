Meteor.methods
	moveMessage: (message, targetName) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] moveMessage -> Invalid user")

		originalMessage = RocketChat.models.Messages.findOneById message._id, {fields: {u: 1, rid: 1, file: 1}}
		if not originalMessage?
			throw new Meteor.Error 'message-moving-not-allowed', "[methods] moveMessage -> Message with id [#{message._id} dos not exists]"

		hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', originalMessage.rid)
		#luwei TODO:check permission for sending message in target room, i.e. has subscription and not muted
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'

		deleteOwn = originalMessage?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			throw new Meteor.Error 'message-moving-not-allowed', "[methods] moveMessage -> Message moving not allowed"

		keepHistory = RocketChat.settings.get 'Message_KeepHistory'
		showDeletedStatus = RocketChat.settings.get 'Message_ShowDeletedStatus'

		# if keepHistory
		# 	if showDeletedStatus
		# 		RocketChat.models.Messages.cloneAndSaveAsHistoryById originalMessage._id
		# 	else
		# 		RocketChat.models.Messages.setHiddenById originalMessage._id, true
		#
		# 	if originalMessage.file?._id?
		# 		RocketChat.models.Uploads.update originalMessage.file._id, {$set: {_hidden: true}}
		#
		# else
		# 	if not showDeletedStatus
		# 		RocketChat.models.Messages.removeById originalMessage._id
		#
		# 	if originalMessage.file?._id?
		# 		RocketChat.models.Uploads.remove originalMessage.file._id
		# 		Meteor.fileStore.delete originalMessage.file._id
		#
		# if showDeletedStatus
		# 	RocketChat.models.Messages.setAsDeletedById originalMessage._id
		# else
		# 	RocketChat.Notifications.notifyRoom originalMessage.rid, 'deleteMessage', {_id: originalMessage._id}

		room = RocketChat.models.Rooms.findOneByName targetName
		if room?
			RocketChat.models.Messages.setRidById originalMessage._id,room._id
			if originalMessage.file?._id?
		 		RocketChat.models.Uploads.setRidById originalMessage.file._id,room._id
			RocketChat.Notifications.notifyRoom originalMessage.rid, 'deleteMessage', {_id: originalMessage._id}
			return {
				rid:room._id
				name:room.name
				t:room.t
			}
		else
			throw new Meteor.Error 'message-moving-not-allowed', "[methods] moveMessage -> Message moving with wrong target name "+targetName
