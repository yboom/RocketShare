Meteor.startup ->
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup'],
		id: 'mentions',
		i18nTitle: 'Mentions',
		icon: 'icon-at',
		template: 'mentionsFlexTab',
		order: 3
	})
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup'],
		id: 'channelsgroups',
		i18nTitle: 'Channels Groups',
		icon: 'icon-link-ext',
		template: 'channelsGroupsFlexTab',
		order: 3
	})
