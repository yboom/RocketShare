Template.fileToRoom.helpers
	roomName: ->
		return Template.instance().roomName?.get()

	roomType: ->
		return Template.instance().roomType?.get()

	creation: ->
		return moment(this.uploadedAt).format('LLL')

	path: ->
		return Template.instance().path?.get()

	getMsgText: (id) ->
		msg = ChatMessage.findOne { file: { _id: id } }
		if msg
			return " - "+msg.msg
		else
			return "" #luwei TODO: when not cached in client

	getFileIcon: (type) ->
		if type.match(/^image\/.+$/)
			return 'icon-picture'

		return 'icon-doc'

	customClassForFileType: ->
		if @type.match(/^image\/.+$/)
			return 'room-files-swipebox'

	escapedName: ->
		return s.escapeHTML @name

Template.fileToRoom.onCreated ->
	file = Template.currentData()
	subscription = ChatSubscription.findOne {rid:file.rid} # can't use ChatRoom.findOne when no room ever opened
	if subscription?
		@roomName = new ReactiveVar subscription.name

		switch subscription.t
			when 'd'
				@roomType = new ReactiveVar 'icon-at'
			when 'c'
				@roomType = new ReactiveVar 'icon-hash'
			when 'p'
				@roomType = new ReactiveVar 'icon-lock'

		switch subscription.t
			when 'c'
				@path = new ReactiveVar FlowRouter.path 'channel', { name: subscription.name }
			when 'p'
				@path = new ReactiveVar FlowRouter.path 'group', { name: subscription.name }
			when 'd'
				@path = new ReactiveVar FlowRouter.path 'direct', { username: subscription.name }
