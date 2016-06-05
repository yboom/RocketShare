###
# RichMessageFormat is a named function that will parse RichMessageFormat syntax
# @param {Object} message - The message object
###

class RichMessageFormat
	constructor: (msg) ->
		if _.isString msg
			message =
				html : msg
		else
			message = msg

		#luwei for table
		if message.html.split("|").length > 2 #message.html.indexOf("|") >= 0
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
		else
			if message.html.split("\t").length > 2
				lines = message.html.split(/[\n\r]/)
				firstLine = true
				message.html = ""
				# yu for table colspan rowspan
				merge_cell = false
				last = ""
				tab_index = 0
				lines.reverse()
				for line, i in lines
					if line.indexOf('&lt;&lt;&lt;') > 0
						last = line
						tab_index = lines.length - 1 - i
						break
				if last.length > 0
					# console.log last
					if last.indexOf('&lt;&lt;&lt;') > 0
						merge_cell = true
				lines.reverse()
				if merge_cell
					row_span = 0
					row_span1 = 0
					for line, i in lines
						if firstLine
							if line.indexOf('\t')<0
								message.html+=line+"<br/>"
								return
							message.html+='<div style="overflow-x:auto;"><table><tr class="first">'
						else
							message.html+="<tr>"
						rows = line.split('\t')
						col_span = 0
						col_j = 0
						for row, j in rows
							if i == tab_index
								row = row.replace("&lt;&lt;&lt;","")
							if row.length > 0
								cols = 0
								j_index = j + 1
								for r, index_j in rows
									if index_j >= j_index
										if i == tab_index
											r = r.replace("&lt;&lt;&lt;","")
										if r.length > 0
											break
										else
											cols = cols + 1
								if cols > 0
									col_span = cols
									col_j = j
									if row_span1 == 0
										row_span1 = -1
									cols = cols + 1
									# console.log row
									# console.log 'colspan='+cols
									if i == tab_index
										message.html += '<td colspan="'+cols+'">'+row.replace("&lt;&lt;&lt;","")+'</td>'
									else
										message.html += '<td colspan="'+cols+'">'+row+'</td>'
								else
									if j > 1
										if i == tab_index
											message.html+="<td>"+row.replace("&lt;&lt;&lt;","")+"</td>"
										else
											message.html+="<td>"+row+"</td>"
									else
										ro = 0
										i_index = i + 1
										for ln, index_i in lines
											if index_i >= i_index
												rows_x = ln.split('\t')
												end = false
												for r_r, m in rows_x
													if m == j
														if i == tab_index
															r_r = r_r.replace("&lt;&lt;&lt;","")
														if r_r.length > 0
															end = true
															break
														else
															if j > 0
																t_row = rows_x[j-1]
																if t_row.length > 0
																	end = true
																	break
																else
																	ro = ro + 1
															else
																ro = ro + 1
												if end
													break
										if ro > 0
											if j == 0
												row_span = ro
											if j == 1
												row_span1 = ro
											ro = ro + 1
											# console.log row
											# console.log 'rowspan='+ro
											if i == tab_index
												message.html += '<td rowspan="'+ro+'" style="text-align:right;vertical-align:middle;">'+row.replace("&lt;&lt;&lt;","")+'</td>'
											else
												message.html += '<td rowspan="'+ro+'" style="text-align:right;vertical-align:middle;">'+row+'</td>'
										else
											if i == tab_index
												message.html+="<td>"+row.replace("&lt;&lt;&lt;","")+"</td>"
											else
												message.html+="<td>"+row+"</td>"
							else
								if j == 0
									if row_span == 0
										message.html+="<td>"+row+"</td>"
									else
										if row_span > 0
											row_span = row_span - 1
										else
											row_span = 0
								else if j == 1
									if row_span1 == 0
										message.html+="<td>"+row+"</td>"
									else
										if row_span1 > 0
											row_span1 = row_span1 - 1
										else
											row_span1 = 0
								else
									max_j = col_j + col_span
									if j < col_j or j > max_j
										message.html+="<td>"+row+"</td>"
							if j == rows.length - 1
								if row_span1 == -1
									row_span1 = 0
						message.html+="</tr>"
						firstLine = false
					message.html+="</table></div>"
				else
					_.forEach lines, (line) ->
				 		if firstLine
				 			if line.indexOf('\t')<0
				 				message.html+=line+"<br/>"
				 				return
				 			message.html+='<div style="overflow-x:auto;"><table><tr class="first">'
				 		else
				 			message.html+="<tr>"
				 		rows = line.split('\t')
				 		_.forEach rows, (row) ->
				 			message.html+="<td>"+row+"</td>"
				 		message.html+="</tr>"
				 		firstLine = false
					message.html+="</table></div>"

		# console.log JSON.stringify message
		message.html = message.html.replace /\n/gm, '<br/>'

		#luwei for mentions editable
		message.html = message.html.replace /\{\{(.*)\}\}/m, '$1'

		#luwei for checkbox.
		canEdit = false
		if message.rid?
			if Meteor.isClient
				hasPermission = RocketChat.authz.hasAtLeastOnePermission('edit-message', message.rid)
			else
				hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'edit-message', message.rid)
			editAllowed = RocketChat.settings.get 'Message_AllowEditing'
			editOwn = message?.u?._id is Meteor.userId()
			editMentioned = (Meteor.userId() in (item._id for item in message?.mentions ? [])) #luwei for mentions editable
			canEdit = hasPermission or (editAllowed and editOwn) or (editAllowed and editMentioned)
		reg = /\[([xX]*)\]/gm
		cnt = 0
		lastIndex=0
		html = ""
		while (result = reg.exec(message.html))?
			cid = message._id+"-"+cnt
			html += message.html.substring(lastIndex,result.index)
			html += '<input id="'+cid+'" class="message-checkbox" type="checkbox" '
			if _.trim(result[1])
				html+='checked="checked"'
			if canEdit
				html+='/>'
			else
				html+=' disabled="disabled"/>'
			cnt++
			lastIndex=reg.lastIndex
		if lastIndex<message.html.length
			html+=message.html.substring(lastIndex,message.html.length)
		message.html=html
		#message.html = message.html.replace /\[\]/gm, '<input type="checkbox" disabled="disabled"/>'
		#message.html = message.html.replace /\[[xX]\]/gm, '<input type="checkbox" checked="checked" disabled="disabled"/>'

		#luwei for progress bar
		reg = /==(\d+)%/gm
		while (result = reg.exec(message.html))?
			if parseInt(result[1])>=100
				message.html = message.html.replace '=='+result[1]+'%', '<div class="meter nostripes"><span style="width: '+result[1]+'%"><span></span></span></div>'+result[1]+'%'
			else
				message.html = message.html.replace '=='+result[1]+'%', '<div class="meter animate"><span style="width: '+result[1]+'%"><span></span></span></div>'+result[1]+'%'
		#message.html = message.html.replace /==(\d+)%/gm, '<div class="meter animate"><span style="width: $1%"><span></span></span></div>$1%'#'<progress value="$1%" max="200">$1%</progress>'

		#luwei for marks
		message.html = message.html.replace /^\.\d+\s*/m, ''
		message.html = message.html.replace /^(.*td>)\.\d+\s*/m, '$1'

		if not _.isString msg
			msg = message
		else
			msg = message.html

		console.log 'RichMessageFormat', msg if window?.rocketDebug

		return msg

#RocketChat.callbacks.add 'renderMessage', RichMessageFormat, RocketChat.callbacks.priority.HIGH
RocketChat.RichMessageFormat = RichMessageFormat

#if Meteor.isClient
#	Blaze.registerHelper 'RocketChatRichMessageFormat', (text) ->
#		return RocketChat.RichMessageFormat text
