###
# AutoLinker is a named function that will replace links on messages
# @param {Object} message - The message object
###

class AutoLinker
	constructor: (message) ->
		if Meteor.isClient
			URL={}
			URL.parse = (url) ->
				a = document.createElement('a');
				a.href=url
				ret =
					href: a.href
					protocol: a.protocol
					host: a.host
					hostname: a.hostname
					port: a.port
					pathname: a.pathname
				return ret
		else
			URL = Npm.require('url')
		if _.trim message.html
			# Separate text in code blocks and non code blocks
			msgParts = message.html.split /(```\w*[\n ]?[\s\S]*?```+?)|(`(?:[^`]+)`)/

			for part, index in msgParts
				if part?.length? > 0
					# Verify if this part is code
					codeMatch = part.match /(?:```(\w*)[\n ]?([\s\S]*?)```+?)|(?:`(?:[^`]+)`)/
					if not codeMatch?
						msgParts[index] = Autolinker.link part,
							stripPrefix: false
							twitter: false
							replaceFn: (autolinker, match) ->
								if match.getType() is 'url'
									root = Meteor.absoluteUrl "" #RocketChat.settings.get 'Site_Url'
									rootObj = URL.parse root
									urlObj = URL.parse match.getUrl()
									console.log(rootObj.hostname+" "+urlObj.hostname)
									if rootObj.hostname is urlObj.hostname #match.getUrl().startsWith(root)
										return '<a href="'+match.getUrl()+'" target="new"><i class="icon-link"></i></a>'
									return /(:\/\/|www\.).+/.test match.matchedText
								return true

			# Re-mount message
			message.html = msgParts.join('')

		return message

RocketChat.callbacks.add 'renderMessage', AutoLinker
