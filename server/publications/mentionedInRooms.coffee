Meteor.publish 'mentionedInRooms', (limit = 50) ->
	unless this.userId
		return this.ready()

	publication = @

	user = RocketChat.models.Users.findOneById this.userId
	unless user
		return this.ready()

	cursorHandle = RocketChat.models.Messages.findByMention(user.username, { sort: { ts: -1 }, limit: limit }).observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_mentioned_in_rooms', _id, record)

		changed: (_id, record) ->
			publication.changed('rocketchat_mentioned_in_rooms', _id, record)

		removed: (_id) ->
			publication.removed('rocketchat_mentioned_in_rooms', _id)

	@ready()
	@onStop ->
		cursorHandle.stop()
