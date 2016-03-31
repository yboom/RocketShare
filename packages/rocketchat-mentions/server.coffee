###
# Mentions is a named function that will process Mentions
# @param {Object} message - The message object
###

class MentionsServer
	constructor: (message) ->
		# If message starts with /me, replace it for text formatting
		mentions = []
		msgMentionRegex = new RegExp '(?:^|\\s|\\n)(?:@)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
		message.msg.replace msgMentionRegex, (match, mention) ->
			mentions.push mention
		if mentions.length isnt 0
			mentions = _.unique mentions
			verifiedMentions = []
			mentions.forEach (mention) ->
				if mention is 'all'
					verifiedMention =
						_id: mention
						username: mention
					room = RocketChat.models.Rooms.findOneById(message.rid)
					if room?
						room.usernames.forEach (username) ->
							vm = Meteor.users.findOne({username: username}, {fields: {_id: 1, username: 1}})
							verifiedMentions.push vm if vm?
				else
					verifiedMention = Meteor.users.findOne({username: mention}, {fields: {_id: 1, username: 1}})

				verifiedMentions.push verifiedMention if verifiedMention?
			if verifiedMentions.length isnt 0
				message.mentions = verifiedMentions

		channels = []
		msgChannelRegex = new RegExp '(?:^|\\s|\\n)(?:#)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
		message.msg.replace msgChannelRegex, (match, mention) ->
			channels.push mention

		if channels.length isnt 0
			channels = _.unique channels
			verifiedChannels = []
			channels.forEach (mention) ->
				verifiedChannel = RocketChat.models.Rooms.findOneByNameAndType(mention, 'c', { fields: {_id: 1, name: 1, topic: 1 } })
				verifiedChannels.push verifiedChannel if verifiedChannel?

			if verifiedChannels.length isnt 0
				message.channels = verifiedChannels

		#luwei
		groups = []
		msgGroupRegex = new RegExp '(?:^|\\s|\\n)(?:!)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
		message.msg.replace msgGroupRegex, (match, mention) ->
			groups.push mention

		if groups.length isnt 0
			groups = _.unique groups
			verifiedGroups = []
			groups.forEach (mention) ->
				verifiedGroup = RocketChat.models.Rooms.findOneByNameAndType(mention, 'p', { fields: {_id: 1, name: 1, topic: 1 } })
				verifiedGroups.push verifiedGroup if verifiedGroup?

			if verifiedGroups.length isnt 0
				message.groups = verifiedGroups

		return message

RocketChat.callbacks.add 'beforeSaveMessage', MentionsServer, RocketChat.callbacks.priority.HIGH
