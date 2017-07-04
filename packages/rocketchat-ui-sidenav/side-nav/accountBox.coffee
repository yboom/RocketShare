Template.accountBox.helpers
	myUserInfo: ->
		visualStatus = "online"
		username = Meteor.user()?.username
		switch Session.get('user_' + username + '_status')
			when "away"
				visualStatus = t("away")
			when "busy"
				visualStatus = t("busy")
			when "offline"
				visualStatus = t("invisible")
		return {
			name: Session.get('user_' + username + '_name')
			status: Session.get('user_' + username + '_status')
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: username
		}

	showAdminOption: ->
		return RocketChat.authz.hasAtLeastOnePermission( ['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting'])

	registeredMenus: ->
		return AccountBox.getItems()

Template.accountBox.events
	'click #account-ext-tree': (event) ->
		event.preventDefault()
		#the following is copied from starredRooms.coffee. here is a place place
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
			room = ChatRoom.findOne({"_id":sub.rid})
			if room?
				#console.log room
				grp.usernames = room.usernames
				grp.lm = room.lm
				grp.msgs = room.msgs
			#else	#only opened room gets room.usernames.
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

	'click #account-ext-op': (event) ->
		event.preventDefault()
		privateGroups = []
		#query = { t: { $in: ['p']}, f: { $ne: true }, archived: { $ne: true } }
		query = { t: { $in: ['p']}, archived: { $ne: true } }
		cursor = ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
		cursor.forEach (sub) ->
			#console.log sub
			grp = {"name":sub.name, "url":RocketChat.roomTypes.getRouteLink(sub.t,sub) ,"unread":sub.unread, "alert":sub.alert}
			room = ChatRoom.findOne({"_id":sub.rid})
			if room?
				privateGroups.push room
			#else	#only opened room gets room.usernames.
			#	Meteor.call 'getRoomModeratorsAndOwners', sub.rid, 1000, (err, result) =>
			#		if result
			#			console.log result

		console.log privateGroups

	'click .options .status': (event) ->
		event.preventDefault()
		AccountBox.setStatus(event.currentTarget.dataset.status)

	'click .account-box': (event) ->
		AccountBox.toggle()

	'click #logout': (event) ->
		event.preventDefault()
		user = Meteor.user()
		Meteor.logout ->
			FlowRouter.go 'home'
			Meteor.call('logoutCleanUp', user)

	'click #avatar': (event) ->
		FlowRouter.go 'changeAvatar'

	'click #account': (event) ->
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()
		FlowRouter.go 'account'

	'click #admin': ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()
		FlowRouter.go 'admin-info'

	'click .account-link': ->
		menu.close()

	'click .account-box-item': ->
		if @sideNav?
			SideNav.setFlex @sideNav
			SideNav.openFlex()

Template.accountBox.onRendered ->
	AccountBox.init()
