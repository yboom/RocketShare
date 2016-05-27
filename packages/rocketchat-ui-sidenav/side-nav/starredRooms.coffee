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
			"name": "Exit",
			"parent": null,
			"children": []}]

		favorites=[]
		query = { f: true, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		cursor= ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			console.log sub
			favorites.push {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub)}
		treeData[0].children.push {"name":t('Favorites'),"children":breakNameToNodes(favorites)}

		privateGroups = []
		query = { t: { $in: ['p']}, f: { $ne: true }, archived: { $ne: true } }
		cursor = ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			console.log sub
			privateGroups.push {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub)}
		treeData[0].children.push {"name":t('Private_Groups'),"children":breakNameToNodes(privateGroups)}
		#console.log treeData

		channels=[]
		query =
			t: { $in: ['c']},
			open: true

		if !RocketChat.settings.get 'Disable_Favorite_Rooms'
			query.f = { $ne: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		cursor= ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			console.log sub
			channels.push {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub)}
		treeData[0].children.push {"name":t('Channels'),"children":breakNameToNodes(channels)}

		#list all channels
		#Meteor.call 'channelsList', '', 1000, (err, result) =>
		#	if result
		#		console.log result

		displayTree(treeData)
