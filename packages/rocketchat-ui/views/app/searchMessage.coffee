Template.searchMessage.helpers
	result: ->
		items = Template.instance().searchResult.get()
		if items?
			return {
				items: items
				length: items.length
			}
		else
			return {
				items: []
				length: 0
			}

	type: ->
		switch this.t
			when 'd' then 'icon-at'
			when 'c' then 'icon-hash'
			when 'p' then 'icon-lock'

	path: ->
		url = ""
		switch this.t
			when 'c'
				url = url +  FlowRouter.path 'channel', { name: this.name }
			when 'p'
				url = url +  FlowRouter.path 'group', { name: this.name }
			when 'd'
				url = url +  FlowRouter.path 'direct', { username: this.name }
		url = url + "?id="+this._id

Template.searchMessage.events
	'keydown #search-term': (event) ->
		if event.which is 13
			event.stopPropagation()
			event.preventDefault()

	#'keyup #search-term': (event) ->
	#	event.stopPropagation()
	#	event.preventDefault()
	#
	#	Session.set('searchTerm', event.currentTarget.value.trim())
	"keyup #search-term": _.debounce (e, t) ->
		value = e.target.value.trim()
		if value is '' and t.currentSearchTerm.get()
			t.currentSearchTerm.set ''
			t.searchResult.set undefined
			t.hasMore.set false
			return
		else if value is t.currentSearchTerm.get()
			return

		t.hasMore.set true
		t.limit.set 20
		t.search()
	, 500

Template.searchMessage.onCreated ->
	@currentSearchTerm = new ReactiveVar ''
	@searchResult = new ReactiveVar

	@hasMore = new ReactiveVar true
	@limit = new ReactiveVar 20
	@ready = new ReactiveVar true

	@search = =>
		@ready.set false
		value = @$('#search-term').val()
		Tracker.nonreactive =>
			yboom.websql.searchMessage value, @limit.get(), (error, result) =>
				console.log result
				@currentSearchTerm.set value
				@ready.set true
				if result? and (result.length > 0)
					@searchResult.set result
					if result.messages?.length + result.users?.length + result.channels?.length < @limit.get()
						@hasMore.set false
				else
					@searchResult.set()
