Meteor.methods
	deleteMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteMessage -> Invalid user")

		originalMessage = RocketChat.models.Messages.findOneById message._id, {fields: {u: 1, rid: 1, file: 1}}
		if not originalMessage?
			throw new Meteor.Error 'message-deleting-not-allowed', "[methods] deleteMessage -> Message with id [#{message._id} dos not exists]"

		hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'delete-message', originalMessage.rid)
		deleteAllowed = RocketChat.settings.get 'Message_AllowDeleting'

		deleteOwn = originalMessage?.u?._id is Meteor.userId()

		unless hasPermission or (deleteAllowed and deleteOwn)
			throw new Meteor.Error 'message-deleting-not-allowed', "[methods] deleteMessage -> Message deleting not allowed"

		keepHistory = RocketChat.settings.get 'Message_KeepHistory'
		showDeletedStatus = RocketChat.settings.get 'Message_ShowDeletedStatus'

		if keepHistory
			if showDeletedStatus
				RocketChat.models.Messages.cloneAndSaveAsHistoryById originalMessage._id
			else
				RocketChat.models.Messages.setHiddenById originalMessage._id, true

			if originalMessage.file?._id?
				RocketChat.models.Uploads.update originalMessage.file._id, {$set: {_hidden: true}}

		else
			if not showDeletedStatus
				RocketChat.models.Messages.removeById originalMessage._id
				RocketChat.models.Rooms.incMsgCountAndSetLastMessageTimestampById(originalMessage.rid, -1, originalMessage.ts); # modify msgs

			if originalMessage.file?._id?
				RocketChat.models.Uploads.remove originalMessage.file._id
				Meteor.fileStore.delete originalMessage.file._id

		if showDeletedStatus
			RocketChat.models.Messages.setAsDeletedById originalMessage._id
		else
			RocketChat.Notifications.notifyRoom originalMessage.rid, 'deleteMessage', {_id: originalMessage._id}
