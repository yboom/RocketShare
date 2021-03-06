Meteor.publish 'mobileMessages', (rid, start, mid) ->
	unless this.userId
		return this.ready()

	publication = this

	if typeof rid isnt 'string'
		return this.ready()
	canAccess = true
	if mid
		#console.log rid
		room = RocketChat.models.Rooms.findOneByName rid
		#console.log room
		if not room
			#console.log 'message'
			message = RocketChat.models.Messages.findOneById mid[0]
			#console.log message
			rid = message.rid
		else
			rid = room._id
		if not Meteor.call 'canAccessRoom', rid, this.userId
			canAccess = false
		cursor = RocketChat.models.Messages.findByRoomIdAndMessageIds rid, mid,
			sort:
				ts: -1
		#console.log cursor
		#return cursor
	else
		if not Meteor.call 'canAccessRoom', rid, this.userId
			return this.ready()
		cursor = RocketChat.models.Messages.findVisibleByRoomId rid,
			sort:
				ts: -1
			limit: 50
		if start
			cursor = RocketChat.models.Messages.findVisibleByRoomIdBeforeTimestamp rid,start,
				sort:
					ts: -1
				limit: 50

	cursorHandle = cursor.observeChanges
		added: (_id, record) ->
			record.starred = _.findWhere record.starred, { _id: publication.userId }
			if not canAccess
				record.msg='Access denied'
			publication.added('rocketchat_message', _id, record)

		changed: (_id, record) ->
			record.starred = _.findWhere record.starred, { _id: publication.userId }
			if not canAccess
				record.msg='Access denied' #publication.added('rocketchat_message', _id, {msg:'Access denied'})
			publication.changed('rocketchat_message', _id, record)

	cursorDelete = RocketChat.models.Messages.findInvisibleByRoomId rid,
		fields:
			_id: 1

	cursorDeleteHandle = cursorDelete.observeChanges
		added: (_id, record) ->
			publication.added('rocketchat_message', _id, {_hidden: true})
		changed: (_id, record) ->
			publication.added('rocketchat_message', _id, {_hidden: true})

	@ready()
	@onStop ->
		cursorHandle.stop()
		cursorDeleteHandle.stop()
