#, 'directmessage'
Meteor.startup ->
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup'],
		id: 'ext-messages',
		i18nTitle: 'ext-messages',
		icon: 'icon-folder',
		template: null,
		order: 101})
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup'],
		id: 'room-ext',
		i18nTitle: 'room-ext',
		icon: 'icon-list-alt',
		template: null,
		order: 102})
