Template.mentionedInRooms.helpers
	hasMessages: ->
		return MentionsInRooms.find({},{ sort: { ts: -1 } }).count() > 0

	messages: ->
		msgs = MentionsInRooms.find {}, { sort: { ts: -1 } }
		return msgs

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

	hasMore: ->
		return Template.instance().hasMore.get()

Template.mentionedInRooms.onCreated ->
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@autorun =>
		sub = @subscribe 'mentionedInRooms', @limit.get()
		if sub.ready()
			if MentionsInRooms.find().count() < @limit.get()
				@hasMore.set false

Template.mentionedInRooms.events
	'scroll .content': _.throttle (e, instance) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			instance.limit.set(instance.limit.get() + 50)
	, 200
