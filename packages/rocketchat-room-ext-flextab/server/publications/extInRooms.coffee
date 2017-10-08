Meteor.publish 'extInRooms', (limit = 50,date) ->
	unless this.userId
		return this.ready()
	#'ext.startdate':{$gte:'2017-08-15'}}
	#{'ext':{$exists:true},$or:[{'ext.startdate':{$gte:'2017'}},{'ext.enddate':{$gte:'2017'}}]}
	#console.log limit
	#console.log date
	pub = this
	user = RocketChat.models.Users.findOneById this.userId
	unless user
		return this.ready()
	roomQuery =
		usernames: user.username
		ext:
			$exists:true
		$or:[{'ext.startdate':
				$gte:date}
			,
			{'ext.enddate':
				$gte:date}
			,
			{'ext.startdate':
				$exists:false}]
		_hidden:
			$ne: true

	roomOptions =
		sort:
			ts: 1
		fields:
			_id: 1
			name: 1
			topic: 1
			t: 1
			usernames: 1
			ts: 1
			ext: 1

	cursorFileListHandle = RocketChat.models.Rooms.find(roomQuery, roomOptions).observeChanges
		added: (_id, record) ->
			#console.log record
			pub.added('ext_in_rooms', _id, record)

		changed: (_id, record) ->
			pub.changed('ext_in_rooms', _id, record)

		removed: (_id, record) ->
			pub.removed('ext_in_rooms', _id, record)

	this.ready()
	this.onStop ->
		cursorFileListHandle.stop()
