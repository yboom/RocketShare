Template.channelsGroupsFlexTab.helpers
	hasMessages: ->
		return ChannelGroupMessage.find({ rid: @rid }, { sort: { ts: -1 } }).count() > 0

	messages: ->
		return ChannelGroupMessage.find { rid: @rid }, { sort: { ts: -1 } }

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

	hasMore: ->
		return Template.instance().hasMore.get()

Template.channelsGroupsFlexTab.onCreated ->
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@autorun =>
		sub = @subscribe 'channelGroupMessages', @data.rid, @limit.get()
		if sub.ready()
			if ChannelGroupMessage.find({ rid: @data.rid }).count() < @limit.get()
				@hasMore.set false

Template.channelsGroupsFlexTab.events
	'click .message-cog': (e) ->
		e.stopPropagation()
		e.preventDefault()
		message_id = $(e.currentTarget).closest('.message').attr('id')
		$('.message-dropdown:visible').hide()
		$(".mentioned-messages-list \##{message_id} .message-dropdown").remove()
		message = ChannelGroupMessage.findOne message_id
		actions = RocketChat.MessageAction.getButtons message
		el = Blaze.toHTMLWithData Template.messageDropdown, { actions: actions }
		$(".mentioned-messages-list \##{message_id} .message-cog-container").append el
		dropDown = $(".mentioned-messages-list \##{message_id} .message-dropdown")
		dropDown.show()

	'scroll .content': _.throttle (e, instance) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			instance.limit.set(instance.limit.get() + 50)
	, 200
