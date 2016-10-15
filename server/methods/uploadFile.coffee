Meteor.methods
	FileUpload: (file,roomId,user,msgId,msgContent, options) ->
		if file.size > RocketChat.settings.get('FileUpload_MaxFileSize')
			throw new Meteor.Error 400, '[methods] FileUpload -> uploadFile size exceed FileUpload_MaxFileSize'

		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] FileUpload -> Invalid user")
		user = RocketChat.models.Users.findOneById Meteor.userId(), fields: username: 1

		room = Meteor.call 'canAccessRoom', roomId, user._id

		if not room
			return false
		#console.log file
		#console.log Random.id()
		
		if not file.type
			ext = file.name.split('.').pop()
			if ext == 'jpg' or ext == 'png' or ext == 'jpeg' or ext == 'gif'
				file.type = 'image/' + ext
			else
				file.type = 'application/' + ext
		
		filedata = new Buffer(file.data,'base64')
		#console.log filedata
		ab = new ArrayBuffer(filedata.length)
		view = new Uint8Array(ab)
		for i in [0..filedata.length] #(var i=0;i<filedata.length;i++)
    		view[i] = filedata[i]
    	
		record =
			name: file.name
			size: file.size
			type: file.type
			rid: roomId
		#store: Meteor.fileStore
		#data: data
		#file: record

		options =
			store:Meteor.fileStore
			file:record
			data:ab

		options = _.extend({
        	adaptive: true
        	capacity: 0.9
        	chunkSize: 8 * 1024
        	data: null
        	file: null
        	maxChunkSize: 0
        	maxTries: 5
        	onAbort: ()->

       	 	onComplete: ()->

        	onCreate: ()->

        	onError: ()->

        	onProgress: ()->

        	onStart: ()->

        	onStop: ()->

        	store: null
    	}, options)

		uploadId = Random.id()
		adaptive = options.adaptive
		capacity = parseFloat(options.capacity)
		chunkSize = parseInt(options.chunkSize)
		maxChunkSize = parseInt(options.maxChunkSize)
		maxTries = parseInt(options.maxTries)

		store = options.store
		data = options.data
		capacityMargin = 10
		file = options.file
		fileId = null
		offset = 0
		total = options.data.byteLength
		tries = 0
		timeA = null
		timeB = null

		abort = ->
        	#uploading.set(false)
        	#// Remove the file from database
        	store.getCollection().remove(fileId, (err) ->
            	if err
                	console.error 'ufs: cannot remove file ' + fileId + ' (' + err.message + ')'
            	else
                	fileId = null
                	offset = 0
                	tries = 0
                	#loaded.set(0)
                	#complete.set(false)
                	options.onAbort(file))

		onError = (error)->
			return error

		onComplete = (file) ->
					url = file.url.replace(Meteor.absoluteUrl(), '/')
					attachment =
						title: "File Uploaded: #{file.name}"
						title_link: url
					if /^image\/.+/.test file.type
						attachment.image_url = url
						attachment.image_type = file.type
						attachment.image_size = file.size
						attachment.image_dimensions = file.identify?.size
					if /^audio\/.+/.test file.type
						attachment.audio_url = url
						attachment.audio_type = file.type
						attachment.audio_size = file.size
					if /^video\/.+/.test file.type
						attachment.video_url = url
						attachment.video_type = file.type
						attachment.video_size = file.size

					msg = null
					if msgId
						msg = RocketChat.models.Messages.findOneById msgId
					if msg
						originalFileId = null
						if msg.file?._id?
							originalFileId = msg.file._id
						msg.file =
							_id: file._id
						msg.attachments = [attachment]
						Meteor.call 'updateMessage', msg, ->
							if originalFileId
								RocketChat.models.Uploads.remove originalFileId
								Meteor.fileStore.delete originalFileId
							return msg
					else
						if not msgContent
							msgContent = file.name.substr(0, file.name.lastIndexOf('.')) || file.name
						msg =
							_id: Random.id()
							rid: roomId
							msg: msgContent
							file:
								_id: file._id
							groupable: false
							attachments: [attachment]
						Meteor.call 'sendMessage', msg, ->
							return msg

		upload = ->
			length = chunkSize
			sendChunk = ->
				#// Calculate the chunk size
				if offset + length > total
					length = total - offset
				if offset < total
					#// Prepare the chunk
					chunk = new Uint8Array(data, offset, length)
					#console.log chunk
					progress = (offset + length) / total
					timeA = Date.now()
					#// Write the chunk to the store
					Meteor.call 'ufsWrite', chunk, fileId, store.getName(), progress, (err, bytes) ->
						timeB = Date.now()
						if err or not bytes
							#// Retry until max tries is reach
							#// But don't retry if these errors occur
							console.log err
							if tries < maxTries and not _.contains([400, 404], err.error)
								tries += 1
								#// Wait 1 sec before retrying
								Meteor.setTimeout(sendChunk, 1000)
							else
								abort()
								onError(err)
						else
							offset += bytes
							#// Use adaptive length
							if adaptive and timeA and timeB and timeB > timeA
								duration = (timeB - timeA) / 1000
								max = capacity * (1 + (capacityMargin / 100))
								min = capacity * (1 - (capacityMargin / 100))
								if duration >= max
									length = Math.abs(Math.round(bytes * (max - duration)))
								else if (duration < min)
									length = Math.round(bytes * (min / duration))
									#// Limit to max chunk size
								if maxChunkSize > 0 and length > maxChunkSize
									length = maxChunkSize
							#onProgress(file, getProgress())
							sendChunk()
				else
					#// Finish the upload by telling the store the upload is complete
					Meteor.call 'ufsComplete', fileId, store.getName(), (err, uploadedFile) ->
						if err
							console.log err
							abort()
						else if uploadedFile
							#uploading.set(false)
							#complete.set(true)
							file = uploadedFile
							#onProgress(uploadedFile, loaded.get() / progress)
							onComplete(uploadedFile)
			sendChunk()

		start = ->
			if not fileId
        		#// Insert the file in the collection
        		file.userId = user._id
        		file.extension = file.type.split('/').pop()
        		file.store = store.getName()
        		store.getCollection().insert(file, (err, uploadId) ->
                    if err
                        onError(err)
                    else
                        fileId = uploadId
                        file._id = fileId
                        console.log file
                        options.onCreate(file)
                        console.log 'begin load'
                        upload()
                )
			else
				store.getCollection().update(fileId, {
					$set: {uploading: true}
					}, (err, result) ->
						if not err and result
							upload()
				)
		if Meteor.isServer
			start()
		else
			return 0


# Limit a user to sending 5 msgs/second
DDPRateLimiter.addRule
	type: 'method'
	name: 'sendMessage'
	userId: (userId) ->
		return RocketChat.models.Users.findOneById(userId)?.username isnt RocketChat.settings.get('RocketBot_Name')
, 5, 1000
