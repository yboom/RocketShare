Meteor.methods
	findHotel: (value, options) ->
		#console.log value
		query =
			ext:
				$exists:true
			"ext.hotels.hotel_base_dm":
				$regex:value			
			_hidden:
				$ne: true
		options =
			sort:
				lm: 1
			fields:
				_id: 1
				name: 1
				t: 1
				usernames: 1
				ts: 1
				ext: 1
		findHotelExists = (array,value) ->
			exists = false
			for a in array
				if a.hotel_base_dm == value
					exists = true
					break
			return exists
		result = []
		room = RocketChat.models.Rooms.find(query, options).fetch()
		for r in room
			hotel = r.ext.hotels
			for h in hotel
				if not findHotelExists result, h.hotel_base_dm
					result.push h
		#console.log result
		return result
