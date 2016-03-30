###
# Mentions is a named function that will process Mentions
# @param {Object} message - The message object
###

class MentionsClient
	constructor: (message) ->
		if _.trim message.html
			msg = message.html

			mentions = []

			msgMentionRegex = new RegExp '(?:^|\\s|\\n)(?:@)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
			message.msg.replace msgMentionRegex, (match, mention) ->
				mentions.push mention

			me = Meteor.user()?.username

			if mentions.length isnt 0
				mentions = _.unique mentions
				mentions = mentions.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(@(#{mentions}):?)[:.,\s]?", 'g'), (match, mention, username) ->
					if username is 'all'
						return match.replace mention, "<a href=\"\" class=\"mention-link mention-link-me\">#{mention}</a>"

					if not message.temp?
						if not _.findWhere(message.mentions, {username: username})?
							return match

					classes = 'mention-link'
					if username is me
						classes += ' mention-link-me'

					return match.replace mention, "<a href=\"\" class=\"#{classes}\" data-username=\"#{username}\">#{mention}</a>"

			channels = []
			msgChannelRegex = new RegExp '(?:^|\\s|\\n)(?:#)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
			message.msg.replace msgChannelRegex, (match, mention) ->
				channels.push mention

			if channels.length isnt 0
				channels = _.unique channels
				channels = channels.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(#(#{channels}))[:.,\s]?", 'g'), (match, mention, channel) ->
					if not message.temp?
						@roomInfo = _.findWhere(message.channels, {name: channel})
						#if not _.findWhere(message.channels, {name: channel})?
						if not @roomInfo?
							return match
						if @roomInfo.topic?
							@roomInfo.topic = ":"+@roomInfo.topic
						else
							@roomInfo.topic = ""
					return match.replace mention, "<a href=\"\" class=\"mention-link\" data-channel=\"#{channel}\">#{mention}#{@roomInfo.topic}</a>"

			#luwei
			groups = []
			msgGroupRegex = new RegExp '(?:^|\\s|\\n)(?:!)(' + RocketChat.settings.get('UTF8_Names_Validation') + ')', 'g'
			message.msg.replace msgGroupRegex, (match, mention) ->
				groups.push mention

			#console.log groups
			#console.log message
			if groups.length isnt 0
				groups = _.unique groups
				groups = groups.join('|')
				msg = msg.replace new RegExp("(?:^|\\s|\\n)(!(#{groups}))[:.,\s]?", 'g'), (match, mention, group) ->
					if not message.temp?
						@roomInfo = _.findWhere(message.groups, {name: group})
						#if not _.findWhere(message.groups, {name: group})?
						if not @roomInfo?
							return match
						if @roomInfo.topic?
							@roomInfo.topic = ":"+@roomInfo.topic
						else
							@roomInfo.topic = ""
					return match.replace mention, "<a href=\"\" class=\"mention-link\" data-group=\"#{group}\">#{mention}#{@roomInfo.topic}</a>"


			message.html = msg
		return message

RocketChat.callbacks.add 'renderMessage', MentionsClient
RocketChat.callbacks.add 'renderMentions', MentionsClient
