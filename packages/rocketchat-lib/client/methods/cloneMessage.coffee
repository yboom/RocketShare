Meteor.methods
	cloneMessage: (message) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('general.User_logged_out')

		if _.trim(message.msg) isnt ''
			message.u =
				_id: Meteor.userId()
				username: Meteor.user().username

			message.temp = true

			message = RocketChat.callbacks.run 'beforeSaveMessage', message

			ChatMessage.insert message
