FilesInRooms = new Mongo.Collection 'files_in_rooms'

Template.filesInRooms.helpers
	hasFiless: ->
		return FilesInRooms.find({},{ sort: { uploadedAt: -1 } }).count() > 0

	files: ->
		files = FilesInRooms.find {}, { sort: { uploadedAt: -1 } }
		return files

	notReadySubscription: ->
		return 'notready' unless Template.instance().subscriptionsReady()

	hasMore: ->
		return Template.instance().hasMore.get()

Template.filesInRooms.onCreated ->
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 50
	@autorun =>
		sub = @subscribe 'filesInRooms', @limit.get()
		if sub.ready()
			if FilesInRooms.find().count() < @limit.get()
				@hasMore.set false

Template.filesInRooms.events
	'scroll .content': _.throttle (e, instance) ->
		if e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight
			instance.limit.set(instance.limit.get() + 50)
	, 200
