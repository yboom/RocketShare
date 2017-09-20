Template.flexTabBar.helpers
	active: ->
		return 'active' if @template is RocketChat.TabBar.getTemplate() and RocketChat.TabBar.isFlexOpen()
	buttons: ->
		return RocketChat.TabBar.getButtons()
	title: ->
		my_title = t(@i18nTitle) or @title
		if my_title == 'room-ext'
			return ''
		return my_title
	extclass: ->
		my_title = t(@i18nTitle) or @title
		if my_title == 'room-ext'
			return 'room-ext'
		else if my_title == 'ext-messages'
			return 'ext-messages'
		return ''
	visible: ->
		if @groups.indexOf(RocketChat.TabBar.getVisibleGroup()) is -1
			return 'hidden'

Template.flexTabBar.events
	'click .ext-messages':(e) ->
		e.preventDefault()
		#console.log e.target
		if($(e.target).is('div'))
			RocketChat.TabBar.closeFlex()
			$('.flex-tab').css('max-width', '')
			return false
		t_class = $(e.target).attr('class')
		hide = true
		if t_class == 'icon-folder'
			$(e.target).removeClass('icon-folder').addClass('icon-folder-open')
			hide = false
		else
			$(e.target).removeClass('icon-folder-open').addClass('icon-folder')
		messages = $('.extmessage')
		for msg in messages
			if hide
				if(!$(msg).hasClass('hideextmessage')&&!$(msg).hasClass('hidemessage'))
					$(msg).addClass('hideextmessage')
			else
				$(msg).removeClass('hideextmessage')
		RocketChat.TabBar.closeFlex()
		$('.flex-tab').css('max-width', '')
	'click .room-ext':(e) ->
		e.preventDefault()
		#'[{"$set": {"ext":{}}}]'
		rid = Session.get('openedRoom')
		room_ext = []
		cursor = ExtInRooms.find {}, { sort: { ts: -1 } }
		cursor.forEach (sub) ->
			if sub.ext?
				#console.log sub._id
				if sub._id == rid
					room_ext.push sub
		if room_ext.length > 0
			eval(RocketChat.settings.get('ROOM_Ext_Function')+"(room_ext,false)")
		else
			swal {
				title: t('提示')
				text: t('没有附加数据，进行初始化！')
				showCancelButton: true
				confirmButtonColor: '#DD6B55'
				confirmButtonText: t('Yes')
				cancelButtonText: t('No')
				closeOnConfirm: true
				closeOnCancel: true
			},(isConfirm) ->
				if isConfirm is true
					msg = ':=[{"$set":{"ext":{}}}]'
					msgObject = { _id: Random.id(), rid: rid, msg: msg}
					#console.log(msgObject);
					Meteor.call 'sendMessage',msgObject,(error,result) ->
						if !error
							setTimeout ()->
								cursor = ExtInRooms.find {}, { sort: { ts: -1 } }
								cursor.forEach (sub) ->
									#console.log sub
									if sub.ext?
										#console.log sub._id
										if sub._id == rid
											room_ext.push sub
								#console.log room_ext
								if room_ext.length > 0
									eval(RocketChat.settings.get('ROOM_Ext_Function')+"(room_ext,false)")
							,500

		RocketChat.TabBar.closeFlex()
		$('.flex-tab').css('max-width', '')

	'click .tab-button': (e, t) ->
		e.preventDefault()
		if RocketChat.TabBar.isFlexOpen() and RocketChat.TabBar.getTemplate() is @template
			RocketChat.TabBar.closeFlex()
			$('.flex-tab').css('max-width', '')
		else
			if not @openClick? or @openClick(e,t)
				if @width?
					$('.flex-tab').css('max-width', "#{@width}px")
				else
					$('.flex-tab').css('max-width', '')

				RocketChat.TabBar.setTemplate @template, ->
					$('.flex-tab')?.find("input[type='text']:first")?.focus()
					$('.flex-tab .content')?.scrollTop(0)

Template.flexTabBar.onCreated ->
	# close flex if the visible group changed and the opened template is not in the new visible group
	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 500
	date = new Date()
	@autorun =>
		sub = @subscribe 'extInRooms', @limit.get(),date.getFullYear()+'-01-01'
		#console.log sub
		if sub.ready()
			#console.log ExtInRooms.find().count()
			if ExtInRooms.find().count() < @limit.get()
				@hasMore.set false

		visibleGroup = RocketChat.TabBar.getVisibleGroup()

		Tracker.nonreactive =>
			openedTemplate = RocketChat.TabBar.getTemplate()
			exists = false
			RocketChat.TabBar.getButtons().forEach (button) ->
				if button.groups.indexOf(visibleGroup) isnt -1 and openedTemplate is button.template
					exists = true

			unless exists
				RocketChat.TabBar.closeFlex()
