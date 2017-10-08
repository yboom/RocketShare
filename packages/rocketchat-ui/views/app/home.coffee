Template.home.helpers
	title: ->
		return RocketChat.settings.get 'Layout_Home_Title'
	body: ->
		return RocketChat.settings.get 'Layout_Home_Body'
	userId: ->
		#user = RocketChat.models.Users.findOneById Meteor.userId(), fields: username: 1
		#console.log user
		return Meteor.userId()
	studyBody:->
		#console.log Meteor.user().username
		room_study = []
		s_html=''
		cursor = ExtInRooms.find {}, { sort: { "ts": -1 } }
		cursor.forEach (sub) ->
			if sub.ext?
				#console.log sub._id
				if sub.ext.studytrip?
					if sub.ext.studytrip.status?
						if sub.ext.studytrip.status[Meteor.user().username]
							room_study.push sub
		#console.log room_study
		if room_study.length>0
			total = 0
			paths = []
			u = Meteor.user().username
			for e_idx, i in room_study
				score = 0
				if e_idx.ext.studytrip.score?
					score = parseInt(e_idx.ext.studytrip.score)
 				#users = e_idx.usernames
 				finish = e_idx.ext.studytrip.status
 				#for u in users
 				if finish[u]? and finish[u] == 'accomplished'
 					total+=score
				#bid = 'homebaidumap'+e_idx._id+(i+1)
				#data = ''
				if e_idx.ext.studytrip.path?
					#data = JSON.stringify(e_idx.ext.studytrip.path)
					#data = data.replace(/"/g,'&quot;')
					title = e_idx.name
					if e_idx.topic?.length>0
						title = e_idx.topic
					paths.push({'title':title, 'data':e_idx.ext.studytrip.path})
			data = JSON.stringify(paths)
			data = data.replace(/"/g,'&quot;')
			Session.set("data",paths)
			s_html+='<div style="background-color:white;min-height:50px;max-height:180px;margin-bottom:15px;">已完成线路'
			s_html+='<div><span>总积分：'+total+'</span></div>'
			s_html+='</div>'
			s_html+='<div class="baidumap" id="homebaidumap" data="'+data+'" style="width:100%;height:100%;"><div style="text-align:center;"><span>正在加载地图数据…………</span></div></div>'
		return s_html

Template.home.onCreated ->
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
