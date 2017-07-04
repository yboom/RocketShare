RocketChat.MessageAction = new class
	buttons = new ReactiveVar {}

	###
	config expects the following keys (only id is mandatory):
		id (mandatory)
		icon: string
		i18nLabel: string
		action: function(event, instance)
		validation: function(message)
		order: integer
	###
	addButton = (config) ->
		unless config?.id
			throw new Meteor.Error "MessageAction-addButton-error", "Button id was not informed."

		Tracker.nonreactive ->
			btns = buttons.get()
			btns[config.id] = config
			buttons.set btns

	removeButton = (id) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			delete btns[id]
			buttons.set btns

	updateButton = (id, config) ->
		Tracker.nonreactive ->
			btns = buttons.get()
			if btns[id]
				btns[id] = _.extend btns[id], config
				buttons.set btns

	getButtonById = (id) ->
		allButtons = buttons.get()
		return allButtons[id]

	getButtons = (message) ->
		allButtons = _.toArray buttons.get()
		if message
			allowedButtons = _.compact _.map allButtons, (button) ->
				if not button.validation? or button.validation(message)
					return button
		else
			allowedButtons = allButtons

		return _.sortBy allowedButtons, 'order'

	resetButtons = ->
		buttons.set {}

	addButton: addButton
	removeButton: removeButton
	updateButton: updateButton
	getButtons: getButtons
	getButtonById: getButtonById
	resetButtons: resetButtons

Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'edit-message'
		icon: 'icon-pencil'
		i18nLabel: 'Edit'
		action: (event, instance) ->
			message = $(event.currentTarget).closest('.message')[0]
			chatMessages[Session.get('openedRoom')].edit(message)
			$("\##{message.id} .message-dropdown").hide()
			input = instance.find('.input-message')
			Meteor.setTimeout ->
				input.focus()
			, 200
		validation: (message) ->
			editMsg = message.msg.replace '：', ':'
			editMsg = editMsg.replace '＝', '='
			if editMsg.indexOf(':=') == 0
				return false
			hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
			isEditAllowed = RocketChat.settings.get 'Message_AllowEditing'
			#console.log message.mentions
			editOwn = message.u?._id is Meteor.userId() or (Meteor.userId() in (item._id for item in message.mentions ? [])) #luwei for mentiones editable

			return unless hasPermission or (isEditAllowed and editOwn)

			blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
			if blockEditInMinutes? and blockEditInMinutes isnt 0
				msgTs = moment(message.ts) if message.ts?
				currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
				return currentTsDiff < blockEditInMinutes
			else
				return true
		order: 1

	RocketChat.MessageAction.addButton
		id: 'delete-message'
		icon: 'icon-trash-1'
		i18nLabel: 'Delete'
		action: (event, instance) ->
			message = @_arguments[1]
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			return if msg.classList.contains("system")
			swal {
				title: t('Are_you_sure')
				text: t('You_will_not_be_able_to_recover')
				type: 'warning'
				showCancelButton: true
				confirmButtonColor: '#DD6B55'
				confirmButtonText: t('Yes_delete_it')
				cancelButtonText: t('Cancel')
				closeOnConfirm: false
				html: false
			}, ->
				swal
					title: t('Deleted')
					text: t('Your_entry_has_been_deleted')
					type: 'success'
					timer: 1000
					showConfirmButton: false

				if chatMessages[Session.get('openedRoom')].editing.id is message._id
					chatMessages[Session.get('openedRoom')].clearEditing(message)
				chatMessages[Session.get('openedRoom')].deleteMsg(message)
		validation: (message) ->
			deleteMsg = message.msg.replace '：', ':'
			deleteMsg = deleteMsg.replace '＝', '='
			if deleteMsg.indexOf(':=') == 0
				return false
			return RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid ) or RocketChat.settings.get('Message_AllowDeleting') and message.u?._id is Meteor.userId()
		order: 2

	RocketChat.MessageAction.addButton
		id: 'todo-message'
		icon: 'icon-ok-squared'
		i18nLabel: 'Todo'
		action: (event, instance) ->
			message = @_arguments[1]
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			return if msg.classList.contains("system")
			url = $("\##{msg.id} .message-link").prop("href");
			chatMessages[Session.get('openedRoom')].todoMsg(message,url)
		order: 2

	RocketChat.MessageAction.addButton
		id: 'reply-message'
		icon: 'icon-reply'
		i18nLabel: 'Reply'
		action: (event, instance) ->
			message = @_arguments[1]
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			return if msg.classList.contains("system")
			url = $("\##{msg.id} .message-link").prop("href");
			chatMessages[Session.get('openedRoom')].replyMsg(message,url)
		order: 2

	RocketChat.MessageAction.addButton
		id: 'copy-message'
		icon: 'icon-paste'
		i18nLabel: 'Copy'
		action: (event, instance) ->
			message = @_arguments[1]
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			return if msg.classList.contains("system")
			chatMessages[Session.get('openedRoom')].copyMsg(message)
		order: 2

	RocketChat.MessageAction.addButton
		id: 'move-message'
		icon: 'icon-export'
		i18nLabel: 'Move'
		action: (event, instance) ->
			message = @_arguments[1]
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			return if msg.classList.contains("system")

			input = instance.find('.input-message')
			pattern = ///[!#]([^\s\:]+)///m
			name = input.value.match(pattern)?[1]
			if name?
				swal {
					title: t('Are_you_sure')
					text: t('Move_to')+" '"+name+"'."+t('You_will_not_be_able_to_recover')
					type: 'warning'
					showCancelButton: true
					confirmButtonColor: '#DD6B55'
					confirmButtonText: t('Yes_move_it')
					cancelButtonText: t('Cancel')
					closeOnConfirm: false
					html: false
				}, ->
					swal
						title: t('Moved')
						text: t('Your_entry_has_been_moved')
						type: 'success'
						timer: 1000
						showConfirmButton: false

					chatMessages[Session.get('openedRoom')].moveMsg(message,name)
			else
				swal {
					title: t('Input_target_name')
					text: t('Input_channel_or_private_group_in_message_box')
					type: 'warning'
					timer: 4000
					showCancelButton: true
					showConfirmButton: false
				}
		validation: (message) ->
			return RocketChat.authz.hasAtLeastOnePermission('delete-message', message.rid ) or RocketChat.settings.get('Message_AllowDeleting') and message.u?._id is Meteor.userId()
		order: 2

	RocketChat.MessageAction.addButton
		id: 'clone-message'
		icon: 'icon-chat-1'
		i18nLabel: 'Clone'
		action: (event, instance) ->
			message = @_arguments[1]
			msg = $(event.currentTarget).closest('.message')[0]
			$("\##{msg.id} .message-dropdown").hide()
			msg2 = $(msg).next('.message')[0]
			return if msg.classList.contains("system")
			chatMessages[Session.get('openedRoom')].clone(msg,msg2)
		order: 2
