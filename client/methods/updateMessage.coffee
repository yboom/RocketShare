Meteor.methods
	updateMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		originalMessage = ChatMessage.findOne message._id

		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
		editAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = originalMessage?.u?._id is Meteor.userId()
		editMentioned  = (Meteor.userId() in (item._id for item in originalMessage?.mentions ? [])) #luwei for mentions editable
		#console.log (item._id for item in originalMessage?.mentions)

		me = Meteor.users.findOne Meteor.userId()

		unless hasPermission or (editAllowed and editOwn) or (editAllowed and editMentioned)
			toastr.error t('Message_editing_not_allowed')
			throw new Meteor.Error 'message-editing-not-allowed', t('Message_editing_not_allowed')

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(originalMessage.ts) if originalMessage.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockEditInMinutes
				toastr.error t('Message_editing_blocked')
				throw new Meteor.Error 'message-editing-blocked'

		Tracker.nonreactive ->

			message.editedAt = new Date(Date.now() + TimeSync.serverOffset())
			message.editedBy =
				_id: Meteor.userId()
				username: me.username

			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.update
				_id: message._id
				'u._id': Meteor.userId()
			,
				$set:
					"editedAt": message.editedAt
					"editedBy": message.editedBy
					msg: message.msg
