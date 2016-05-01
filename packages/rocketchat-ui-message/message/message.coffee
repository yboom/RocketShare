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

	#luwei for marks
	marked: ->
		#console.log Template.instance().markNum
		if Template.instance().markNum?
			return 'mark'+Template.instance().markNum

	messageLink: ->
		subscription = ChatSubscription.findOne {rid:this.rid}
		url = ""
		if subscription?
			switch subscription.t
				when 'c'
						url = url + FlowRouter.path 'channel', { name: subscription.name }
				when 'p'
						url = url + FlowRouter.path 'group', { name: subscription.name }
				when 'd'
						url = url + FlowRouter.path 'direct', { username: subscription.name }
			url = url + "?id="+this._id
		return url;

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
		editOwn = this.u?._id is Meteor.userId() or (Meteor.userId() in (item._id for item in this.mentions ? [])) #luwei for mentions editable
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

	#luwei for marks
	pattern = ///^\.(\d+)///m
	@markNum = msg.msg.match(pattern)?[1]
	#console.log @markNum

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

			dbts=Math.round (msg.ts.getTime() - Date.parse("March 18, 2016"))/1000/60/60
			roomid = yboom.websql.findRoomId msg.rid
			uid = yboom.websql.findUserId msg.u._id, msg.u.username
			txt = msg.msg
			if msg.attachments?
				txt += " "+msg.attachments[0].title
			yboom.websql.setDoc? msg._id, dbts, roomid, uid, txt

			msg.html = msg.msg
			if _.trim(msg.html) isnt ''
				msg.html = _.escapeHTML msg.html

			message = RocketChat.callbacks.run 'renderMessage', msg
			if message.tokens?.length > 0
				for token in message.tokens
					token.text = token.text.replace(/([^\$])(\$[^\$])/gm, '$1$$$2')
					message.html = message.html.replace token.token, token.text

			#luwei for table
			if message.html.indexOf("|") >= 0
				lines = message.html.split(/[\n\r]/)
				firstLine = true
				message.html = ""
				_.forEach lines, (line) ->
					if firstLine
						if line.indexOf('|')<0
							message.html+=line+"<br/>"
							return
						message.html+='<div style="overflow-x:auto;"><table><tr class="first">'
					else
						message.html+="<tr>"
					rows = line.split('|')
					_.forEach rows, (row) ->
						message.html+="<td>"+row+"</td>"
					message.html+="</tr>"
					firstLine = false
				message.html+="</table></div>"
			# beginTable = false
			# beginTr = false
			# beginTd = false
			# firstOfLine = true
			# msg.html = msg.html.replace new RegExp("([\|\\n\\r])", 'g'), (match, seperator) ->
			# 	console.log seperator
			# 	r = ''
			# 	if seperator is '|'
			# 		if not beginTable
			# 			r = r+"<table>"
			# 			beginTable = true
			# 		if firstOfLine
			# 			firstOfLine = false
			# 			r = r+"<tr>"
			# 			beginRow = true
			# 		if beginTd
			# 			r=r+"</td>"
			# 		r=r+"<td>"
			# 		beginTd=true
			# 	if seperator is '\n' or seperator is '\r'
			# 		firstOfLine = true
			# 		if beginTd
			# 			r=r+"</td>"
			# 			beginTd=false
			# 		if beginTr
			# 			r=r+"</tr>"
			# 			beginTr=false
			# 	return match.replace seperator, r
			# if beginTable
			# 	msg.html+="</table>"

			# console.log JSON.stringify message
			msg.html = message.html.replace /\n/gm, '<br/>'

			#luwei for mentions editable
			msg.html = msg.html.replace /\{\{(.*)\}\}/m, '$1'

			#luwei for checkbox. TODO: click to edit
			msg.html = msg.html.replace /\[\]/gm, '<input type="checkbox" disabled="disabled"/>'
			msg.html = msg.html.replace /\[[xX]\]/gm, '<input type="checkbox" checked="checked" disabled="disabled"/>'

			#luwei for progress bar
			reg = /==(\d+)%/gm
			while (result = reg.exec(msg.html))?
				if parseInt(result[1])>=100
					msg.html = msg.html.replace '=='+result[1]+'%', '<div class="meter nostripes"><span style="width: '+result[1]+'%"><span></span></span></div>'+result[1]+'%'
				else
					msg.html = msg.html.replace '=='+result[1]+'%', '<div class="meter animate"><span style="width: '+result[1]+'%"><span></span></span></div>'+result[1]+'%'
			#msg.html = msg.html.replace /==(\d+)%/gm, '<div class="meter animate"><span style="width: $1%"><span></span></span></div>$1%'#'<progress value="$1%" max="200">$1%</progress>'

			#luwei for marks
			msg.html = msg.html.replace /^\.\d+\s*/m, ''
			msg.html = msg.html.replace /^(.*td>)\.\d+\s*/m, '$1'

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
