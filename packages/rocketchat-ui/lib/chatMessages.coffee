class @ChatMessages
	init: (node) ->
		this.editing = {}
		this.messageMaxSize = RocketChat.settings.get('Message_MaxAllowedSize')
		this.wrapper = $(node).find(".wrapper")
		this.input = $(node).find(".input-message").get(0)
		this.bindEvents()
		return

	resize: ->
		dif = 60 + $(".messages-container").find("footer").outerHeight()
		$(".messages-box").css
			height: "calc(100% - #{dif}px)"

	toPrevMessage: ->
		msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
		if msgs.length
			if this.editing.element
				if msgs[this.editing.index - 1]
					this.edit msgs[this.editing.index - 1], this.editing.index - 1
			else
				this.edit msgs[msgs.length - 1], msgs.length - 1

	toNextMessage: ->
		if this.editing.element
			msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
			if msgs[this.editing.index + 1]
				this.edit msgs[this.editing.index + 1], this.editing.index + 1
			else
				this.clearEditing()

	getEditingIndex: (element) ->
		msgs = this.wrapper.get(0).querySelectorAll(".own:not(.system)")
		index = 0
		for msg in msgs
			if msg is element
				return index
			index++
		return -1

	clone: (element, element2) ->
		readMessage.enable()
		readMessage.readNow()
		id = element.getAttribute("id")
		message = ChatMessage.findOne { _id: id }
		KonchatNotification.removeRoomNotification(message.rid)
		if element2?
			id = element2.getAttribute("id")
			message2 = ChatMessage.findOne { _id: id }
		message._id = Random.id()
		if message2?
			message.ts = new Date((message.ts.getTime()+message2.ts.getTime())/2)
		else
			message.ts = new Date(message.ts.getTime()+500)
		#luwei: if the file is cloned together, when cloned message is deleted the original message loses the file.
		delete message.file
		delete message.attachments
		Meteor.call 'cloneMessage', message

	edit: (element, index) ->
		id = element.getAttribute("id")
		message = ChatMessage.findOne { _id: id }
		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
		editAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = message?.u?._id is Meteor.userId()
		editMentioned = (Meteor.userId() in (item._id for item in message?.mentions ? [])) #luwei for mentions editable
		console.log editMentioned if @debug
		#console.log (item._id for item in message?.mentions)

		return unless hasPermission or (editAllowed and editOwn) or (editAllowed and editMentioned)
		return if element.classList.contains("system")

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(message.ts) if message.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockEditInMinutes
				return

		this.clearEditing()
		this.input.value = message.msg
		if (not editOwn) and (not hasPermission) and editMentioned #luwei for mentions editable
			this.input.setAttribute("original_value",message.msg)
			this.input.value='No part can be edited'
			pattern = ///\{\{(.*)\}\}///m
			match = message.msg.match(pattern)
			console.log match if @debug
			if (match?)
				this.input.value = match[1]
		else
			this.input.removeAttribute("original_value")
		console.log this.input if @debug
		this.editing.element = element
		this.editing.index = index or this.getEditingIndex(element)
		this.editing.id = id
		element.classList.add("editing")
		this.input.classList.add("editing")
		$(this.input).closest('.message-form').addClass('editing');
		setTimeout =>
			this.input.focus()
		, 5

	clearEditing: ->
		if this.editing.element
			this.editing.element.classList.remove("editing")
			this.input.classList.remove("editing")
			$(this.input).closest('.message-form').removeClass('editing');
			this.editing.id = null
			this.editing.element = null
			this.editing.index = null
			this.input.value = this.editing.saved or ""
		else
			this.editing.saved = this.input.value

	send: (rid, input) ->
		if _.trim(input.value) isnt '' or input.hasAttribute("original_value") #luwei partly editing allows empty input
			readMessage.enable()
			readMessage.readNow()
			$('.message.first-unread').removeClass('first-unread')

			if this.editing.id
				this.update(this.editing.id, rid, input)
				return

			if this.isMessageTooLong(input)
				return Errors.throw t('Error_message_too_long')
			KonchatNotification.removeRoomNotification(rid)
			msg = input.value
			input.value = ''
			msgObject = { _id: Random.id(), rid: rid, msg: msg}
			this.stopTyping(rid)
			#Check if message starts with /command
			if msg[0] is '/'
				match = msg.match(/^\/([^\s]+)(?:\s+(.*))?$/m)
				if(match?)
					command = match[1]
					param = match[2]
					Meteor.call 'slashCommand', {cmd: command, params: param, msg: msgObject }
			else
				#Run to allow local encryption
				#Meteor.call 'onClientBeforeSendMessage', {}
				Meteor.call 'sendMessage', msgObject

	deleteMsg: (message) ->
		Meteor.call 'deleteMessage', message, (error, result) ->
			if error
				return Errors.throw error.reason

	moveMsg: (message, targetName) ->
		Meteor.call 'moveMessage', message, targetName, (error, result) ->
			if error
				toastr.error error.reason
				return Errors.throw error.reason
			else
				if result?.t? and result?.name?
					#reload room
					RoomManager.close result.t+result.name

	todoMsg: (message,url) ->
		name = Meteor.user().username+"-todo"
		query = { t: { $in: ['p']}, name: name, open: true }
		if Meteor.user()?.settings?.preferences?.todoGroup?
			query.name=Meteor.user()?.settings?.preferences?.todoGroup
		grp = ChatSubscription.findOne(query)
		#console.log(grp)
		if grp?
			rid=grp.rid
		else
			Meteor.call 'createPrivateGroup', name, [], (err, result) ->
				if err
					if err.error is 'name-invalid'
						return toastr.error err.reason
					#if err.error is 'duplicate-name'
					#	return
					#if err.error is 'archived-duplicate-name'
					#	return
				else
					rid=result?.rid?
		if rid?
			FlowRouter.go 'group', { name: name }
			msg = "[]完成 进度==0%\n>"+url
			msgObject = { _id: Random.id(), rid: rid, msg: msg}
			#Run to allow local encryption
			#Meteor.call 'onClientBeforeSendMessage', {}
			Meteor.call 'sendMessage', msgObject

	replyMsg: (message,url) ->
		this.clearEditing()
		this.input.value = "@"+message.u.username+" : \n> "+url
		pattern = ///^\.(\d+)///m
		markNum = message.msg.match(pattern)?[1]
		if markNum?
			this.input.value = "."+markNum+" "+this.input.value
		setTimeout =>
			this.input.focus()
		, 5

	copyMsg: (message) ->
		this.clearEditing()
		this.input.value = message.msg
		setTimeout =>
			this.input.focus()
		, 5

	pinMsg: (message) ->
		message.pinned = true
		Meteor.call 'pinMessage', message, (error, result) ->
			if error
				return Errors.throw error.reason

	unpinMsg: (message) ->
		message.pinned = false
		Meteor.call 'unpinMessage', message, (error, result) ->
			if error
				return Errors.throw error.reason

	update: (id, rid, input) ->
		if _.trim(input.value) isnt '' or input.hasAttribute("original_value") #luwei partly editing allows empty input
			msg = input.value
			if input.hasAttribute("original_value") #luwei for mentions editable
				msg = input.getAttribute("original_value").replace /\{\{(.*)\}\}/m, '{{'+input.value+'}}'
				input.value = msg;
			if _.trim(msg) isnt ''
				Meteor.call 'updateMessage', { _id: id, msg: msg, rid: rid }
				this.clearEditing()
				this.stopTyping(rid)

	startTyping: (rid, input) ->
		if _.trim(input.value) isnt ''
			MsgTyping.start(rid)
		else
			MsgTyping.stop(rid)

	stopTyping: (rid) ->
		MsgTyping.stop(rid)

	bindEvents: ->
		if this.wrapper?.length
			$(".input-message").autogrow
				postGrowCallback: =>
					this.resize()

	tryCompletion: (input) ->
		value = input.value.match(/[^\s]+$/)
		if value?.length > 0
			value = value[0]

			re = new RegExp value, 'i'

			user = Meteor.users.findOne username: re
			if user?
				input.value = input.value.replace value, "@#{user.username} "

	keyup: (rid, event) ->
		input = event.currentTarget
		k = event.which
		keyCodes = [
			13, # Enter
			20, # Caps lock
			16, # Shift
			9,  # Tab
			27, # Escape Key
			17, # Control Key
			91, # Windows Command Key
			19, # Pause Break
			18, # Alt Key
			93, # Right Click Point Key
			45, # Insert Key
			34, # Page Down
			35, # Page Up
			144, # Num Lock
			145 # Scroll Lock
		]
		keyCodes.push i for i in [35..40] # Home, End, Arrow Keys
		keyCodes.push i for i in [112..123] # F1 - F12

		unless k in keyCodes
			this.startTyping(rid, input)

	keydown: (rid, event) ->
		input = event.currentTarget
		k = event.which
		this.resize(input)
		if k is 13 and not event.shiftKey
			event.preventDefault()
			event.stopPropagation()
			this.send(rid, input)
			return

		if k is 9
			event.preventDefault()
			event.stopPropagation()
			@tryCompletion input

		if k is 27
			if this.editing.id
				event.preventDefault()
				event.stopPropagation()
				this.clearEditing()
				return
		else if k is 38 or k is 40 # Arrow Up or down
			return true #luwei for normal typing experience
			return true if event.shiftKey

			return true if $(input).val().length and !this.editing?.id

			if k is 38
				return if input.value.slice(0, input.selectionStart).match(/[\n]/) isnt null
				this.toPrevMessage()
			else
				return if input.value.slice(input.selectionEnd, input.value.length).match(/[\n]/) isnt null
				this.toNextMessage()

			event.preventDefault()
			event.stopPropagation()

		# ctrl (command) + shift + k -> clear room messages
		else if k is 75 and ((navigator?.platform?.indexOf('Mac') isnt -1 and event.metaKey and event.shiftKey) or (navigator?.platform?.indexOf('Mac') is -1 and event.ctrlKey and event.shiftKey))
			RoomHistoryManager.clear rid

	isMessageTooLong: (input) ->
		input?.value.length > this.messageMaxSize
