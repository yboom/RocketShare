Template.starredRooms.helpers
	rooms: ->
		query = { f: true, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		return ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
	total: ->
		return ChatSubscription.find({ f: true }).count()
	isActive: ->
		return 'active' if ChatSubscription.findOne({ f: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

Template.starredRooms.events
	'click .display-tree': (e, instance) ->
		treeData = [{
			"name": t("Close"),
			"parent": null,
			"children": []}]

		favorites=[]
		query = { f: true, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		cursor= ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			#console.log sub
			favorites.push {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub) ,"unread":sub.unread, "alert":sub.alert}
		favorites=breakNameToNodes(favorites)
		treeData[0].children.push {"name":t('Favorites'),"children":favorites.nodes}

		privateGroups = []
		#query = { t: { $in: ['p']}, f: { $ne: true }, archived: { $ne: true } }
		query = { t: { $in: ['p']}, archived: { $ne: true } }
		cursor = ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			#console.log sub
			grp = {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub) ,"unread":sub.unread, "alert":sub.alert}
			room = ChatRoom.findOne(sub.rid, { reactive: false })
			if room?
				#console.log room
				grp.usernames = room.usernames
				grp.lm = room.lm
				grp.msgs = room.msgs
			#else	#TODO: only opened room gets room.usernames.
			#	Meteor.call 'getRoomModeratorsAndOwners', sub.rid, 1000, (err, result) =>
			#		if result
			#			console.log result

			privateGroups.push grp
		privateGroups=breakNameToNodes(privateGroups)
		treeData[0].children.push {"name":t('Private_Groups'),"children":privateGroups.nodes}
		#console.log treeData

		channels=[]
		query =
			t: { $in: ['c']},
			open: true

		#if !RocketChat.settings.get 'Disable_Favorite_Rooms'
		#	query.f = { $ne: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		cursor= ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			#console.log sub
			channels.push {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub) ,"unread":sub.unread, "alert":sub.alert}
		channels=breakNameToNodes(channels)
		treeData[0].children.push {"name":t('Channels'),"children":channels.nodes}

		#query = { t: { $in: ['d']}, archived: { $ne: true } }
		#cursor = ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		#cursor.forEach (sub) ->
		#	console.log sub

		#list all channels
		#Meteor.call 'channelsList', '', 1000, (err, result) =>
		#	if result
		#		console.log result

		displayTree(treeData, Math.max(favorites.depth, privateGroups.depth, channels.depth)+2, favorites.width+privateGroups.width+channels.width)
