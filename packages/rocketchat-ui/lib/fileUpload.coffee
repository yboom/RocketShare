readAsDataURL = (file, callback) ->
	reader = new FileReader()
	reader.onload = (ev) ->
		callback ev.target.result, file

	reader.readAsDataURL file

readAsArrayBuffer = (file, callback) ->
	reader = new FileReader()
	reader.onload = (ev) ->
		callback ev.target.result, file

	reader.readAsArrayBuffer file


@fileUpload = (files) ->
	roomId = Session.get('openedRoom')
	files = [].concat files

	consume = ->
		file = files.pop()
		if not file?
			swal.close()
			return

		readAsDataURL file.file, (fileContent) ->
			if not fileUploadIsValidContentType file.file.type
				swal
					title: t('FileUpload_MediaType_NotAccepted')
					type: 'error'
					timer: 1000
				return

			if file.file.size is 0
				swal
					title: t('FileUpload_File_Empty')
					type: 'error'
					timer: 1000
				return

			text = ''

			if file.type is 'audio'
				text = """
					<div class='upload-preview'>
						<audio  style="width: 100%;" controls="controls">
							<source src="#{fileContent}" type="audio/wav">
							Your browser does not support the audio element.
						</audio>
					</div>
					<div class='upload-preview-title'>#{Handlebars._escape(file.name)}</div>
				"""
			else
				text = """
					<div class='upload-preview'>
						<div class='upload-preview-file' style='background-image: url(#{fileContent})'></div>
					</div>
					<div class='upload-preview-title'>#{Handlebars._escape(file.name)}</div>
				"""

			swal
				title: t('Upload_file_question')
				text: text
				showCancelButton: true
				closeOnConfirm: false
				closeOnCancel: false
				html: true
			, (isConfirm) ->
				consume()

				if isConfirm isnt true
					return

				readAsArrayBuffer file.file, (data) ->
					record =
						name: file.name or file.file.name
						size: file.file.size
						type: file.file.type
						rid: roomId

					upload = new UploadFS.Uploader
						store: Meteor.fileStore
						data: data
						file: record
						onError: (err) ->
							uploading = Session.get 'uploading'
							if uploading?
								item = _.findWhere(uploading, {id: upload.id})
								if item?
									item.error = err.reason
									item.percentage = 0
								Session.set 'uploading', uploading

						onComplete: (file) ->
							self = this
							#console.log file
							#console.log this
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
							textarea = $('.input-message')
							message = _.trim($(textarea).val())
							if $(textarea).hasClass('editing')
								li = $('.messages-box .editing')
								id = $(li).attr('id')
								if id and id != 'undefined'
									or_message = ChatMessage.findOne { _id: id }
									if or_message
										or_fileId = null
										if or_message.file?._id?
											or_fileId = or_message.file._id
										if message.length > 0
											or_message.msg = message
										or_message.file = 
											_id:file._id
										or_message.attachments = [attachment]
										Meteor.call 'updateMessage', or_message, ->
											$(li).removeClass("editing")
											$(textarea).removeClass("editing")
											$(textarea).closest('.message-form').removeClass('editing')
											$(textarea).val('')
											Meteor.setTimeout ->
												uploading = Session.get 'uploading'
												if uploading?
													item = _.findWhere(uploading, {id: self.id})
													Session.set 'uploading', _.without(uploading, item)
											, 2000
											if or_fileId
												RocketChat.models.Uploads.remove or_fileId
												Meteor.fileStore.delete or_fileId
									else
										RocketChat.models.Uploads.remove file._id
										Meteor.fileStore.delete file._id
										alert('Not found original message')
										return
								else
									RocketChat.models.Uploads.remove file._id
									Meteor.fileStore.delete file._id
									alert('Not found message id')
									return
							else
								if not message or message.length == 0
									message =  file.name.substr(0, file.name.lastIndexOf('.')) || file.name#luwei:""
								msg =
									_id: Random.id()
									rid: roomId
									msg: message
									file:
										_id: file._id
									groupable: false
									attachments: [attachment]

								Meteor.call 'sendMessage', msg, ->
									$(textarea).val('')
									Meteor.setTimeout ->
										uploading = Session.get 'uploading'
										if uploading?
											item = _.findWhere(uploading, {id: self.id})
											Session.set 'uploading', _.without(uploading, item)
									, 2000

					upload.id = Random.id()

					# // Reactive method to get upload progress
					Tracker.autorun (c) ->
						uploading = undefined
						cancel = undefined

						Tracker.nonreactive ->
							cancel = Session.get "uploading-cancel-#{upload.id}"
							uploading = Session.get 'uploading'

						if cancel
							return c.stop()

						uploading ?= []

						item = _.findWhere(uploading, {id: upload.id})

						if not item?
							item =
								id: upload.id
								name: upload.getFile().name

							uploading.push item

						item.percentage = Math.round(upload.getProgress() * 100)
						Session.set 'uploading', uploading

					upload.start();

					# upload.stop();

					Tracker.autorun (c) ->
						cancel = Session.get "uploading-cancel-#{upload.id}"
						if cancel
							upload.stop()
							upload.abort()
							c.stop()

							uploading = Session.get 'uploading'
							if uploading?
								item = _.findWhere(uploading, {id: upload.id})
								if item?
									item.percentage = 0
								Session.set 'uploading', uploading

							Meteor.setTimeout ->
								uploading = Session.get 'uploading'
								if uploading?
									item = _.findWhere(uploading, {id: upload.id})
									Session.set 'uploading', _.without(uploading, item)
							, 1000

	consume()
