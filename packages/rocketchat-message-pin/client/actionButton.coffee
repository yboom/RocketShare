Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'pin-message'
		icon: 'icon-pin'
		i18nLabel: 'Pin_Message'
		action: (event, instance) ->
			message = @_arguments[1]
			message.pinned = true
			Meteor.call 'pinMessage', message, (error, result) ->
				if error
					return Errors.throw error.reason
		validation: (message) ->
			if message.pinned or not RocketChat.settings.get('Message_AllowPinning')
				return false

			if RocketChat.settings.get('Message_AllowPinningByAnyone') or RocketChat.authz.hasRole Meteor.userId(), 'admin'
				return true

			if RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid)
				return true

			return ChatRoom.findOne(message.rid).u?._id is Meteor.userId()
		order: 20

	RocketChat.MessageAction.addButton
		id: 'unpin-message'
		icon: 'icon-pin rotate-45'
		i18nLabel: 'Unpin_Message'
		action: (event, instance) ->
			message = @_arguments[1]
			message.pinned = false
			Meteor.call 'unpinMessage', message, (error, result) ->
				if error
					return Errors.throw error.reason
		validation: (message) ->
			if not message.pinned or not RocketChat.settings.get('Message_AllowPinning')
				return false

			if RocketChat.settings.get('Message_AllowPinningByAnyone') or RocketChat.authz.hasRole Meteor.userId(), 'admin'
				return true

			return ChatRoom.findOne(message.rid).u?._id is Meteor.userId()
		order: 21

	RocketChat.MessageAction.addButton
		id: 'jump-to-pin-message'
		icon: 'icon-right-hand'
		i18nLabel: 'Jump_to_message'
		action: (event, instance) ->
			message = @_arguments[1]
			$('.message-dropdown:visible').hide()
			RoomHistoryManager.getSurroundingMessages(message, 50)
		order: 100
