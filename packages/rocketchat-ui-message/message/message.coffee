Template.message.helpers
	isBot: ->
		return 'bot' if this.bot?
	isGroupable: ->
		return 'false' if this.groupable is false
	isSequential: ->
		return 'sequential' if this.groupable isnt false
	getEmoji: (emoji) ->
		return emojione.toImage emoji
	own: ->
		return 'own' if this.u?._id is Meteor.userId()
	timestamp: ->
		return +this.ts
	chatops: ->
		return 'chatops-message' if this.u?.username is RocketChat.settings.get('Chatops_Username')
	time: ->
		return moment(this.ts).format('LT')
	date: ->
		return moment(this.ts).format('LL')
	isTemp: ->
		if @temp is true
			return 'temp'
	body: ->
		return Template.instance().body

	system: ->
		if RocketChat.MessageTypes.isSystemMessage(this)
			return 'system'

	edited: ->
		return Template.instance().wasEdited

	editTime: ->
		if Template.instance().wasEdited
			return moment(@editedAt).format('LL LT') #TODO profile pref for 12hr/24hr clock?
	editedBy: ->
		return "" unless Template.instance().wasEdited
		# try to return the username of the editor,
		# otherwise a special "?" character that will be
		# rendered as a special avatar
		return @editedBy?.username or "?"
	canEdit: ->
		hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', this.rid)
		isEditAllowed = RocketChat.settings.get 'Message_AllowEditing'
		editOwn = this.u?._id is Meteor.userId() or (Meteor.userId() in (item._id for item in this.mentions ? [])) #luwei TODO for mentiones editable
		#console.log (item._id for item in this.mentions)

		return unless hasPermission or (isEditAllowed and editOwn)

		blockEditInMinutes = RocketChat.settings.get 'Message_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(this.ts) if this.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			return currentTsDiff < blockEditInMinutes
		else
			return true

	canDelete: ->
		if RocketChat.authz.hasAtLeastOnePermission('delete-message', this.rid )
			return true

		return RocketChat.settings.get('Message_AllowDeleting') and this.u?._id is Meteor.userId()
	showEditedStatus: ->
		return RocketChat.settings.get 'Message_ShowEditedStatus'
	label: ->
		if @i18nLabel
			return t(@i18nLabel)
		else if @label
			return @label

	hasOembed: ->
		return false unless this.urls?.length > 0 and Template.oembedBaseWidget? and RocketChat.settings.get 'API_Embed'

		return false unless this.u?.username not in RocketChat.settings.get('API_EmbedDisabledFor')?.split(',')

		return true

Template.message.onCreated ->
	msg = Template.currentData()

	@wasEdited = msg.editedAt? and not RocketChat.MessageTypes.isSystemMessage(msg)

	@body = do ->
		messageType = RocketChat.MessageTypes.getType(msg)
		if messageType?.render?
			return messageType.render(msg)
		else if messageType?.template?
			# render template
		else if messageType?.message?
			if messageType.data?(msg)?
				return TAPi18n.__(messageType.message, messageType.data(msg))
			else
				return TAPi18n.__(messageType.message)
		else
			if msg.u?.username is RocketChat.settings.get('Chatops_Username')
				msg.html = msg.msg
				message = RocketChat.callbacks.run 'renderMentions', msg
				# console.log JSON.stringify message
				return msg.html

			msg.html = msg.msg
			if _.trim(msg.html) isnt ''
				msg.html = _.escapeHTML msg.html

			message = RocketChat.callbacks.run 'renderMessage', msg
			if message.tokens?.length > 0
				for token in message.tokens
					token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2')
					message.html = message.html.replace token.token, token.text

			# console.log JSON.stringify message
			msg.html = message.html.replace /\n/gm, '<br/>'
			#luwei TODO: for checkbox
			msg.html = message.html.replace /\{\{(.*)\[\](.*)\}\}/gm, '$1<input type="checkbox"/>$2'
			msg.html = message.html.replace /\{\{(.*)\[[xX]\](.*)\}\}/gm, '$1<input type="checkbox" checked="checked"/>$2'
			return msg.html

Template.message.onViewRendered = (context) ->
	view = this
	this._domrange.onAttached (domRange) ->
		currentNode = domRange.lastNode()
		currentDataset = currentNode.dataset
		previousNode = currentNode.previousElementSibling
		nextNode = currentNode.nextElementSibling
		$currentNode = $(currentNode)
		$previousNode = $(previousNode)
		$nextNode = $(nextNode)

		unless previousNode?
			$currentNode.addClass('new-day').removeClass('sequential')

		else if previousNode?.dataset?
			previousDataset = previousNode.dataset

			if previousDataset.date isnt currentDataset.date
				$currentNode.addClass('new-day').removeClass('sequential')
			else
				$currentNode.removeClass('new-day')

			if previousDataset.groupable is 'false' or currentDataset.groupable is 'false'
				$currentNode.removeClass('sequential')
			else
				if previousDataset.username isnt currentDataset.username or parseInt(currentDataset.timestamp) - parseInt(previousDataset.timestamp) > RocketChat.settings.get('Message_GroupingPeriod') * 1000
					$currentNode.removeClass('sequential')
				else if not $currentNode.hasClass 'new-day'
					$currentNode.addClass('sequential')

		if nextNode?.dataset?
			nextDataset = nextNode.dataset

			if nextDataset.date isnt currentDataset.date
				$nextNode.addClass('new-day').removeClass('sequential')
			else
				$nextNode.removeClass('new-day')

			if nextDataset.groupable isnt 'false'
				if nextDataset.username isnt currentDataset.username or parseInt(nextDataset.timestamp) - parseInt(currentDataset.timestamp) > RocketChat.settings.get('Message_GroupingPeriod') * 1000
					$nextNode.removeClass('sequential')
				else if not $nextNode.hasClass 'new-day'
					$nextNode.addClass('sequential')

		if not nextNode?
			templateInstance = view.parentView.parentView.parentView.parentView.parentView.templateInstance?()

			if currentNode.classList.contains('own') is true
				templateInstance?.atBottom = true
			else
				if templateInstance?.atBottom isnt true
					newMessage = templateInstance?.find(".new-message")
					newMessage?.className = "new-message"
