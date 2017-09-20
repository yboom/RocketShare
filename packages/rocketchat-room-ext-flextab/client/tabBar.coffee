#, 'directmessage'
Meteor.startup ->
	if RocketChat.settings.get('ROOM_Ext_Message_Switch')
		RocketChat.TabBar.addButton({
			groups: ['channel', 'privategroup'],
			id: 'ext-messages',
			i18nTitle: 'ext-messages',
			icon: 'icon-folder',
			template: null,
			order: 101})
	if (RocketChat.settings.get('ROOM_Ext_Function'))?.length>0
		RocketChat.TabBar.addButton({
			groups: ['channel', 'privategroup'],
			id: 'room-ext',
			i18nTitle: 'room-ext',
			icon: 'icon-list-alt',
			template: null,
			order: 102})
