Template.mentionToRoom.helpers
	roomName: ->
		return Template.instance().roomName?.get()

	type: ->
		return Template.instance().type?.get()

	creation: ->
		return moment(this.ts).format('LLL')

	path: ->
		return Template.instance().path?.get()

Template.mentionToRoom.onCreated ->
	msg = Template.currentData()
	subscription = ChatSubscription.findOne {rid:msg.rid} # can't use ChatRoom.findOne when no room ever opened
	if subscription?
		@roomName = new ReactiveVar subscription.name

		switch subscription.t
			when 'd'
				@type = new ReactiveVar 'icon-at'
			when 'c'
				@type = new ReactiveVar 'icon-hash'
			when 'p'
				@type = new ReactiveVar 'icon-lock'

		switch subscription.t
			when 'c'
				@path = new ReactiveVar FlowRouter.path 'channel', { name: subscription.name }
			when 'p'
				@path = new ReactiveVar FlowRouter.path 'group', { name: subscription.name }
			when 'd'
				@path = new ReactiveVar FlowRouter.path 'direct', { username: subscription.name }
