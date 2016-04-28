RocketChat.models.Uploads = new class extends RocketChat.models._Base
	constructor: ->
		@_initModel 'uploads'

		@tryEnsureIndex { 'rid': 1 }
		@tryEnsureIndex { 'uploadedAt': 1 }

	setRidById: (_id, rid) ->
		query =
			_id: _id

		update =
			$set:
				rid: rid

		return @update query, update

	removeByRoomId: (roomId) ->
		query =
			rid: roomId
		cursor = @find query, {}
		cursor.forEach (upload) ->
			Meteor.fileStore.delete upload._id
		return @remove query
