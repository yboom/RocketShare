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
		
		selfString = null
		
		sumEval = (message,column) ->
			#console.log column
			#console.log message
			#console.log message.urls
			s = 0
			if message.urls and message.urls.length > 0
				for url, i in message.urls
					#console.log url
					#index = url.url.indexOf('id=')
					#msgId = url.meta.msg._id
					#msgs = Meteor.call 'findOneMessage', url.meta.msg, (error,result)->
					#	if(result)
					#		console.log 'msg'
					#		console.log result
					#		return result
					if !url or !url.meta or !url.meta.msg or !url.meta.msg.msg
						continue
					value = url.meta.msg.msg
					string = value.replace(/=？/gm,'=?')
					string = string.replace(/＝？/gm,'=?')
					string = string.replace(/＝\?/gm,'=?')
					array = string.split("=?")
					if array.length >= column
						s_value = array[column-1]
						if s_value.length == 0
							return 0
						else
							str_value = s_value.replace(/（/gm,'(')
							str_value = str_value.replace(/）/gm,')')
							sumArray = str_value.split("sum(")
							if(sumArray.length > 1)
								for str, j in sumArray
									if j == 0
										continue
								#if s_value.lastIndexOf('sum(') > -1
								#	last = s_value.lastIndexOf('sum(')
								#	str = s_value.substring(last+4)
									index = str.indexOf(')')
									v = sumEval(url.meta.msg,str.substring(0,index))
									s_value = s_value.replace('sum('+str.substring(0, index)+')',v)
									#console.log s_value
							#v = Eval(s_value,false)
							#g = 0
							#for k in [0..v.length]
							#	chart = v.substring(v.length-k-1,v.length-k)
							#	if chart == '.'
							#		continue
							#	if !isNaN(chart) and k == v.length-1
							#		g = eval(v)
							#	if isNaN(chart) or chart == ' '
							#		g = eval(v.substring(v.length-k))
							#		break
							s = Eval(s_value,true) + s
							#s = g + s
			return s
		
		Eval = (string,t) ->
					cal='+-*/().:＋－＊／（）：' #['+','-','*','/','(',')','.','－','d','a','y'];
					sep = 0
					result = ''
					for j in [0..string.length]
						#console.log j
						noRight = false
						if j == string.length
							break;
						if sep > 0
							sep--
							continue
						chart = string.substring(string.length-j-1,string.length-j)
						if !isNaN(chart) and chart != ' ' and j < string.length-1
							continue
						if chart == ':' or chart == '：'
							str = string.substring(0,string.length-j-1)
							ri_qi = str.indexOf('day(')
							if ri_qi == -1
								ri_qi = str.indexOf('day（')
							#console.log str
							str = str.replace(/（/gm,'(')
							right = str.lastIndexOf('(')
							if right > -1 and ri_qi > -1
								chart = '('
								l = str.length - right
								#console.log l
								j = j + l
								sep = l
							else
								noRight = true
						if (chart == '(' or chart == '（') and (j+3 < string.length)
							l = string.length-j-4
							if(l>=0)
								d = string.substring(l,l+3)
								#console.log('day='+d);
								if d == 'day'
									#console.log d
									if l>0
										f = string.substring(l-1,l);
										#console.log('f='+f);
										if cal.indexOf(f) > -1 and (f!='(' or f!= ')' or f!='（' or f!= '）')
											#console.log j
											sep = sep + 3
										else
											str = string.substring(string.length-j)
											str = 'day'+chart+str
											newstr = str
											str = str.replace(/（/gm,'(')
											str = str.replace(/）/gm,')')
											#str = str.replace(/\./gm,'-')
											str = str.replace(/t/gm,'T')
											str = str.replace(/：/gm,':')
											day = str.split('day(')
											if day.length > 0
												daystring = ''
												if day[0].length > 0
													daystring = day[0]
												for d, k in day
													if k == 0
														continue
													sday = d.replace(/ /gm,'')
													st = sday.split('T')
													s = st[0].replace(/\./gm,'-')
													sday = s
													if st.length > 1
														sday += 'T' + st[1]
													index = sday.indexOf(')')
													daystring += 'new Date("' + sday.substring(0,index)+'")/1000/3600/24'+ sday.substring(index+1)
												str = daystring
												#console.log str
											try
												r = eval(str)
												result += string + '=' + r #.replace(newstr,r) #
												if t
													result = result.replace(string+'=','')
													result = result.replace('? ','')
													result = eval(result)
											catch e
												result += string.replace(newstr,0) # + '=? '
												if t
													result = 0
											break
						if (cal.indexOf(chart) == -1) or (cal.indexOf(chart) > -1 and j == string.length-1) or noRight
							str = string.substring(string.length-j)
							if j == string.length-1
								str = string.substring(string.length-j-1)
							#console.log str
							newstr = str 
							str = str.replace(/（/gm,'(')
							str = str.replace(/）/gm,')')
							str = str.replace(/＋/gm,'+')
							str = str.replace(/－/gm,'-')
							str = str.replace(/＊/gm,'*')
							str = str.replace(/／/gm,'/')
							
							#if str.indexOf('(') > -1 and str.indexOf(')') > -1
							left = str.split('(')
							right = str.split(')')
							#console.log 'left'
							#console.log left
							#console.log 'right'
							#console.log right
							if left.length > 1 && left[left.length-1].length > 0 && left.length == right.length
								try
									r = eval(str)
									result += string + '=' + r #.replace(newstr,r) #
									if t
										result = result.replace(string+'=','')
										result = result.replace('? ','')
										result = eval(result)
								catch e
									result += string.replace(newstr,0) # + '=? '
									if t
										result = 0
							else
								#console.log str
								try
									r = eval(str)
									if !isNaN(r)
										result += string + '=' + r #.replace(newstr,r) #
										if t
											result = result.replace(string+'=','')
											result = result.replace('? ','')
											result = eval(result)
									else
										result += string.replace(newstr,0) # + '=? '
										if t
											result = 0
								catch e
									result += string.replace(newstr,0) # + '=? '
									if t
										result = 0
							break
					return result
		
		evalExpression = (string) ->
					cal='+-*/().:＋－＊／（）：' #['+','-','*','/','(',')','.','－','d','a','y'];
					sep = 0
					result = ''
					for j in [0..string.length]
						#console.log j
						noRight = false
						if j == string.length
							break;
						if sep > 0
							sep--
							continue
						chart = string.substring(string.length-j-1,string.length-j)
						if !isNaN(chart) and chart != ' ' and j < string.length-1
							continue
						if chart == ':' or chart == '：'
							str = string.substring(0,string.length-j-1)
							ri_qi = str.indexOf('day(')
							if ri_qi == -1
								ri_qi = str.indexOf('day（')
							#console.log str
							#str = str.replace(/（/gm,'(')
							right = str.lastIndexOf('(')
							#console.log right
							if right > -1 and ri_qi > -1
								chart = '('
							else
								right = str.lastIndexOf('（')
								if right > -1 and ri_qi > -1
									chart = '（'
							if right > -1 and ri_qi > -1
								l = str.length - right
								#console.log l
								j = j + l
								sep = l
							else
								noRight = true
						if (chart == '(' or chart == '（') and (j+3 < string.length)
							l = string.length-j-4
							if(l>=0)
								d = string.substring(l,l+3)
								#console.log('day='+d);
								if d == 'day' or d == 'sum'
									#console.log d
									if l>0
										f = string.substring(l-1,l);
										#console.log('f='+f);
										if cal.indexOf(f) > -1 and (f!='(' or f!= ')' or f!='（' or f!= '）')
											#console.log j
											sep = sep + 3
										else
											str = string.substring(string.length-j)
											#console.log 'str'
											#console.log str
											if d == 'day'
												result = 'day'+chart+str
											else
												result = 'sum'+chart+str
											#console.log 'result'
											#console.log result
											break
						if (cal.indexOf(chart) == -1) or (cal.indexOf(chart) > -1 and j == string.length-1) or noRight
							result = string.substring(string.length-j)
							if j == string.length-1
								result = string.substring(string.length-j-1)
							#console.log str
							break 
					return result
		
		htmlEval = (value) ->
			#console.log value
			string = value.replace(/=？/gm,'=?')
			string = string.replace(/＝？/gm,'=?')
			string = string.replace(/＝\?/gm,'=?')
			#console.log string
			array = string.split("=?")
			if array.length > 1
				result = ''
				#console.log array
				cal='+-*/().:＋－＊／（）：' #['+','-','*','/','(',')','.','－','d','a','y'];
				for string, i in array
					if i == array.length-1
						break
					if string.length == 0
						continue
					str_value = string
					str_value = str_value.replace(/（/gm,'(')
					str_value = str_value.replace(/）/gm,')')
					sumArray = str_value.split("sum(")
					#str_length = 0
					#str_dic = {}
					if(sumArray.length > 1)
						for str, j in sumArray
							if j == 0
								#str_length = str.length
								continue
						#if str_value.lastIndexOf('sum(') > -1
						#	last = str_value.lastIndexOf('sum(')
						#	str = str_value.substring(last+4)
							index = str.indexOf(')')
							v = sumEval(msg,str.substring(0,index))
							str_sum = 'sum('+str.substring(0, index)+')'
							str_value = str_value.replace(str_sum,v)
							#str_dic[str_length] = [str_sum,v]
							#str_length = str_length + str.length + 4
							#console.log str_value
							#console.log v
					str = Eval(str_value,true)
					expression = evalExpression(string)
					prev = string.replace(expression,'');
					if expression.length == 0
						expression = string
						prev = ' '
					#result += string + '=' + str
					result += prev+'<a href="javascript:void(0)" style="text-decoration:none;" class="equ-link" title="'+expression+'" alt="'+expression+'">'+str+'</a>&nbsp;&nbsp;&nbsp;'
					#console.log str
					#console.log str_dic
					#if !isNaN(str.replace(/ /gm,''))
					#	result += string + '=' + v
					#else
					#	index = str.indexOf("=")
					#	v = str.substring(index+1)
					#	q = str.substring(0,index)
					#	if q.lastIndexOf(v) > -1
					#		result += string + '=' + v
					#	else
					#		result += str
				last = array[array.length-1].replace("&lt;&lt;&lt;","")
				result += last
				#console.log(result)
				return result
			else
				return value

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
		#yu for eval =?
		ehtml = htmlEval message.html
		#console.log ehtml
		message.html = ehtml

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
