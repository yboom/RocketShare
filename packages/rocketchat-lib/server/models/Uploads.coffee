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
