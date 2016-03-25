Meteor.publish 'filesInRooms', (limit = 50) ->
	unless this.userId
		return this.ready()

	pub = this

	fileQuery =
		userId: this.userId
		complete: true
		uploading: false
		_hidden:
			$ne: true

	fileOptions =
		limit: limit
		sort:
			uploadedAt: -1
		fields:
			_id: 1
			userId: 1
			rid: 1
			name: 1
			type: 1
			url: 1
			uploadedAt: 1

	cursorFileListHandle = RocketChat.models.Uploads.find(fileQuery, fileOptions).observeChanges
		added: (_id, record) ->
			pub.added('files_in_rooms', _id, record)

		changed: (_id, record) ->
			pub.changed('files_in_rooms', _id, record)

		removed: (_id, record) ->
			pub.removed('files_in_rooms', _id, record)

	this.ready()
	this.onStop ->
		cursorFileListHandle.stop()
