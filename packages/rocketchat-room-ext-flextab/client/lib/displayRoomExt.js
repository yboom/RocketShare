window.displayRoomExt=function(ext,showTitle)
{
	var rooms = ext;
	var isTitle = showTitle;
  	var weekDays = ["日","一","二","三","四","五","六"];
  	var dayClassName = ["tuanhao","xingcheng","hotel_name","hotel_fukuan","hotel_double","hotel_single","hotel_sidao","book_number","bus_company","bus_use_time","driver","dinner","jingdian","airport"];
	var cal = "+-*/().%＋－＊／（）％";
	var th_cal = ["th_gongzi","th_fee","th_cfbz","th_df"];
	var hb_arrive = true;
	var msgQueue = [];
	var currentShowDiv = null;
	var hotelAlert = {};
	var clickShow = false;
	var timeOutShow = null;
	var findHotels = [];
	var timeOutSearch = null;
	var td_switch = false;
	var width = window.innerWidth || document.documentElement.clientWidth ||
    document.body.clientWidth;
  	var height = window.innerHeight || document.documentElement.clientHeight ||
    document.body.clientHeight;
    var show = null;
    saveLocalStorage();
  function saveLocalStorage()
  {
  	if(isTitle)
  	{
  		try
  		{
  			localStorage.setItem('room-ext',JSON.stringify(rooms));
  		}catch(oException){
			if(oException.name == 'QuotaExceededError'){
				console.log('超出本地存储限额！');
				//如果历史信息不重要了，可清空后再设置
				//localStorage.removeItem('room-ext');
				//localStorage.setItem(key,value);
			}
		}
  	}
  	else
  	{
  		var r = localStorage.getItem('room-ext');
  		var curRoom = r ? JSON.parse(r) : [];
  		if(curRoom.length==0) curRoom.push(rooms[0]);
  		else
  		{
  			var newRoom = [];
  			var id = rooms[0]._id;
  			for(var i=0;i<curRoom.length;i++)
  			{
  				if(curRoom[i]._id != id)
  				{
  					newRoom.push(curRoom[i]);
  				}
  			}
  			newRoom.push(rooms[0]);
  			try
  			{
  				localStorage.setItem('room-ext',JSON.stringify(newRoom));
  			}catch(oException){
				if(oException.name == 'QuotaExceededError'){
					console.log('超出本地存储限额！');
					//如果历史信息不重要了，可清空后再设置
					//localStorage.removeItem('room-ext');
					//localStorage.setItem(key,value);
				}
			}
  		}
  	}
  }
  function cancelDiv(e)
  {
  	$(e).parent().parent().hide();
  	if(show) $(show).css('background-color','white');
  	show = null;
  	currentShowDiv = null;
  	if(clickShow) clickShow = false;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  }
  window.cancelDiv = cancelDiv;
  function submitDayInfo(e)
  {
  	var div = $(e).parent().parent();
  	var rid = $(div).attr("id");
  	var day = $(div).attr("data-day");
  	var inputs = $(div).find("input");
  	var textareas = $(div).find("textarea");
  	var className = $(show).attr("class");
  	var json = {};
  	//console.log(inputs);
  	//console.log(textareas);
  	//console.log(show);
  	for(var i=0;i<inputs.length;i++)
  	{
  		var input = inputs[i];
  		var cln = $(input).attr('class');
  		if(cln.indexOf('hasDatepicker')>0) cln = cln.replace(' hasDatepicker','');
  		json[cln] = $(input).val().replace(/\'/gm,'\'');
  	}
  	for(var i=0;i<textareas.length;i++)
  	{
  		var textarea = textareas[i];
  		json[$(textarea).attr('class')] = $(textarea).val();
  	}
  	var value=JSON.stringify(json);
	//console.log(value);
  	var r = findRoomByRid(rid);
  	//console.log(JSON.parse(value));
  	if(inputs.length>0 || textareas.length>0)
  	{
  		//value = value.replace('{"','');
  		//value = value.replace('"}','');
  		var msg = '';
  		if(!r.ext.days || !r.ext.days[day])
  		{
  			var tr = $(show).parent().parent();
  			var span = $(tr).find('span');
  			if(!span || !span.length) return;
  			var week = $(span[0]).text();
  			var date = $(span[1]).text();
  			msg = ':=[{"$set": {"ext.days.'+day+'.week":"'+week+'","ext.days.'+day+'.date":"'+date+'","ext.days.'+day+'.'+className+'":'+value+'}}]';
  		}
  		else
  		{
  			msg = ':=[{"$set": {"ext.days.'+day+'.'+className+'":'+value+'}}]';
  		}
  		//console.log(msg);
  		//console.log(JSON.parse(msg.replace(':=','')));
  		//console.log(r.ext.days[day]);
  		sendMessage(rid,msg);
  		if(className == dayClassName[2] || className == dayClassName[6])
  		{
  			//{ $push : { field : value } }
  			//console.log(JSON.parse(value));
  			if(className == dayClassName[6])
  			{
  				value = value.replace(/"other_/g,'"hotel_');
  			}
  			var jsonv = JSON.parse(value);
  			//console.log(jsonv);
  			if(jsonv.hotel_base_xc) delete jsonv.hotel_base_xc;
  			if(jsonv.hotel_small_price) delete jsonv.hotel_small_price;
  			//if(jsonv.hotel_baojie) delete jsonv.hotel_baojie;
  			if(jsonv.hotel_total_price) delete jsonv.hotel_total_price;
  			if(jsonv.hotel_single_num) delete jsonv.hotel_single_num;
  			if(jsonv.hotel_double_num) delete jsonv.hotel_double_num;
  			if(jsonv.hotel_base_shuoming) delete jsonv.hotel_base_shuoming;

  			value=JSON.stringify(jsonv);
  			var days = r.ext.hotels;
  			var exists = false;
  			var hotel_name = '';
  			for(var vk in days)
  			{
  				var info = days[vk];
  				if (info.hotel_base_dm == jsonv.hotel_base_dm)
  				{
  					exists = true;
  					hotel_name = info.hotel_base_dm;
  					break;
  				}
  			}
  			msg = '';
  			if(!r.ext.hotels || !exists)
  			{
  				if(jsonv.hotel_base_dm) msg = ':=[{"$push":{"ext.hotels":'+value+'}}]';
  			}
  			else
  			{
  				if(hotel_name) msg = ':=[{"ext.hotels.hotel_base_dm":"'+hotel_name+'"},{"$set":{"ext.hotels.$":'+value+'}}]';
  			}
  			if(msg.length>0) sendHotelMessage(rid,msg);
  		}
  	}
  }
  window.submitDayInfo = submitDayInfo;
  function getExpression(value)
  {
  	value = value.replace('＝','=');
  	if(value.indexOf('=')>0)
  		value = value.substring(0,value.indexOf('='));

  	var string = value;//.substring(0,value.lastIndexOf('='));
  	var expression = '';
  	for(var i=0;i<string.length;i++)
  	{
  		chart = string.charAt(i);
  		if(!isNaN(chart))
  		{
  			expression += chart;
  		}
  		else
  		{
  			if(cal.indexOf(chart)>-1)
  			{
  				if(chart == '%' || chart == '％')
  				{
  					var index = 1;
  					for(;;)
  					{
  						var num = expression.substring(expression.length-index);
  						if(num.indexOf('-') == 0 || num.indexOf('+') == 0 || num.indexOf('－') == 0 || num.indexOf('＋') == 0)
  						{
  							var str = expression.substring(0,expression.length-index);
  							//console.log(str);
  							expression = str + '*(1'+num+'/100)';
  							break;
  						}
  						else
  						{
  							index += 1;
  						}
  						if(index>=expression.length) break;
  					}
  				}
  				else
  				{
  					expression += chart;
  				}
  				//expression += chart;
  			}
  		}
  	}
  	if(expression.length>0)
  	{
  		expression = expression.replace(/（/gm,'(');
		expression = expression.replace(/）/gm,')');
		expression = expression.replace(/＋/gm,'+');
		expression = expression.replace(/－/gm,'-');
		expression = expression.replace(/＊/gm,'*');
		expression = expression.replace(/／/gm,'/');
		expression = expression.replace(/\(\)/gm,'0');
  	}
  	if(expression.lastIndexOf(' ')>0) expression = expression.substring(expression.lastIndexOf(' '));
  	return expression;
  }
  function computeResult(t)
  {
  	var value = $(t).val();
  	if(value.length<=0)
  	{
  		var span = $(t).parent().next().get(0);
  		if(span) $(span).text('=');
  	}
  	//if(value.indexOf("=")>0 || value.indexOf("＝")>0)
  	{
  		var r = 0;
  		var expression = getExpression(value);
  		if(expression.length>0)
  		{
  			r = eval(expression);
  			//if(!isNaN(r))
  			{
  				//$(t).val(string+'='+r);
  				var span = $(t).parent().next();
  				if(span&&span.length>0)
  				{
  					$(span).text('='+r);
  				}
  			}
  		}
  		else
  		{
  			var span = $(t).parent().next();
  			if(span&&span.length>0)
  			{
  				$(span).text('=');
  			}
  		}
  		var div = $(t).parent().parent().parent();
  		var className = $(t).attr("class");
  		if(className.indexOf('th_')==0)
  		{
  			var total = $(div).find(".th_total");
  			//console.log(total);
  			if(total && total.length>0)
  			{
  				var expression = '0';
  				for(var i=0;i<th_cal.length;i++)
  				{
  					if($(t).attr('class') != th_cal[i])
  					{
  						var other = $(div).find("."+th_cal[i]);
  						if(other && other.length>0)
  						{
  							var v = $(other).parent().next().text();
  							v = v.replace('=','');
  							if(v.length>0)
  							{
  								expression = expression + '+' + v;
  							}
  						}
  					}
  				}
  				expression = expression + '+' + r;
  				if(expression.length>0)
  				{
  					var total_result = eval(expression);
  					//if(!isNaN(total_result))
  					$(total).val(total_result);
  				}
  			}
  		}
  		else if(className.indexOf('hotel_')==0)
  		{
  			var total = $(div).find(".hotel_total_price").get(0);
  			var small = $(div).find(".hotel_small_price").get(0);
  			if(small)
  			{
  				var v_small = $(small).val();
  				if(!v_small) v_small = 0;
  				var result = eval(v_small+'+'+r);
  				if(total) $(total).val(result);
  			}
  		}
  		else if(className.indexOf('other_')==0)
  		{
  			var total = $(div).find(".other_total_price").get(0);
  			var small = $(div).find(".other_small_price").get(0);
  			if(small)
  			{
  				var v_small = $(small).val();
  				if(!v_small) v_small = 0;
  				var result = eval(v_small+'+'+r);
  				if(total) $(total).val(result);
  			}
  		}
  	}
  }
  window.computeResult = computeResult;
  function mouseOverShowDiv(e)
  {
  	clickShow = false;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	if(!day) day = '100000';
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(!r || !r.ext) return;
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	if(!json.simple_base && className == "xingcheng")
  	{
  		//console.log('xc');
  		if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day]['hotel_name'])
  		{
  			//console.log(r.ext.days[day]['hotel_name'].hotel_base_xc);
  			json.simple_base = r.ext.days[day]['hotel_name'].hotel_base_xc;
  		}
  	}
  	else if(className == "bus_company")
  	{
  		if(!json.bus_base && json.simple_base)
		{
			json.bus_base = json.simple_base;
			delete json.simple_base;
		}
  		if(!json.bus_driver && r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day]['driver'])
  		{
  			json.bus_driver = r.ext.days[day]['driver'].simple_base;
  		}
  	}
  	else if(className.indexOf('line_')==0&&!json[className])
  	{
  		if(className.indexOf('line_gys')==0)
  		{
  			json = r.ext[className];
  		}
  		else
  		{
  			json[className] = r.ext[className];
  		}
  	}
  	//console.log(json);
  	var s=false;
  	var first = '';
  	for(var key in json)
  	{
  		if(json[key] && json[key].length>0)
		{
			s = true;
			first = key;
			break;
		}
	}
	if(!s) return;
  	var div = $(".mouse_show_div");
  	var top = $(e).position().top+$(e).height()+23;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","mouse_show_div");
  		$(div).attr("id",rid);
  	  	$(div).attr("data-day",day);
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px',
  					'background-color':'rgba(238, 238, 238, 0.8)','font-size':'15px','width':w,'height':'auto','border':'1px solid rgba(166, 166, 166, 0.999)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '';
  		if(first.indexOf('th_')==0)
  		{
  			info_html +='<div style="margin-left:6px;margin-top:2px;"><div><span>姓名：'+(json.th_base_name ? json.th_base_name : "")+'</span></div>';
  			info_html += '<div><span>城市：'+(json.th_base_city ? json.th_base_city : "")+'</span></div>';
  			info_html += '<div><span>电话：'+(json.th_xmdh ? json.th_xmdh : "")+'</span></div>';
  			info_html += '<div><span>工资：'+(json.th_gongzi ? json.th_gongzi : "")+'</span>';
  			var r='';
  			if(json.th_gongzi)
  			{
  				var expression = getExpression(json.th_gongzi);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div><span>小费：'+(json.th_fee ? json.th_fee : "")+'</span>';
  			r='';
  			if(json.th_fee)
  			{
  				var expression = getExpression(json.th_fee);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div><span>餐补：'+(json.th_cfbz ? json.th_cfbz : "")+'</span>';
  			r='';
  			if(json.th_cfbz)
  			{
  				var expression = getExpression(json.th_cfbz);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div><span>垫付：'+(json.th_df ? json.th_df : "")+'</span>';
  			r='';
  			if(json.th_df)
  			{
  				var expression = getExpression(json.th_df);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div><span>合计：'+(json.th_total ? json.th_total : "")+'</span></div>';
  			info_html += '<div><span>结算：'+(json.th_jiesuan ? json.th_jiesuan : "")+'</span></div>';//
  			info_html += '<div><span>报价：'+(json.th_baojie ? json.th_baojie : "")+'</span></div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('hotel_')==0)
		{
			if(!json.hotel_base_dm) return;
			info_html += '<div style="margin-left:6px;margin-top:2px;">';
			//info_html += '<div><span>行程：'+(json.hotel_base_xc ? json.hotel_base_xc : "")+'</span></div>';
  			info_html += '<div><span>酒店名：'+(json.hotel_base_dm ? json.hotel_base_dm : "")+'</span></div>';
  			info_html += '<div><span>星级：'+(json.hotel_xingji ? json.hotel_xingji : "")+'</span></div>';
  			info_html += '<div><span>地址：'+(json.hotel_address ? json.hotel_address : "")+'</span></div>';
  			info_html += '<div><span>电话：'+(json.hotel_phone ? json.hotel_phone : "")+'</span></div>';
  			info_html += '<div><span>电邮：'+(json.hotel_email ? json.hotel_email : "")+'</span></div>';
  			info_html += '<div><span>双间价：'+(json.hotel_double_price ? json.hotel_double_price : "")+'</span></div>';
  			info_html += '<div><span>单间价：'+(json.hotel_single_price ? json.hotel_single_price : "")+'</span></div>';
  			var p_result = 0;
  			/*if(json.hotel_small_price && json.hotel_small_price != "0")
  			{
  				info_html += '<div><span>小计：'+(json.hotel_small_price ? json.hotel_small_price : "")+'</span></div>';
  				p_result = json.hotel_small_price;
  			}
  			else//*/
  			{
  				var d_num = r.ext.days[day].hotel_double ? r.ext.days[day].hotel_double : 0;
  				var s_num = r.ext.days[day].hotel_single ? r.ext.days[day].hotel_single : 0;
  				var d_price = json.hotel_double_price ? json.hotel_double_price : 0;
  				var s_price = json.hotel_single_price ? json.hotel_single_price : 0;
  				p_result = eval(d_num+'*'+d_price+'+'+s_num+'*'+s_price);
  				info_html += '<div><span>小计：'+(p_result)+'</span></div>';
  			}
  			info_html += '<div><span>其他报价：'+(json.hotel_baojie ? json.hotel_baojie : "")+'</span>';
  			var r='';
  			if(json.hotel_baojie)
  			{
  				var expression = getExpression(json.hotel_baojie);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  				else
  				{
  					p_result = eval(p_result + r);
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div>取消政策：<div style="margin-left:15px;">';
  			for(var i=1;i<=5;i++)
  			{
  				info_html += '<div><span>'+i+'：'+(json['hotel_cancelzc'+i+'_day'] ? json['hotel_cancelzc'+i+'_day'] : "")+'天内，退款';
  				info_html += ''+(json['hotel_cancelzc'+i+'_bfb'] ? json['hotel_cancelzc'+i+'_bfb'] : "")+'％，说明：';
  				info_html += ''+(json['hotel_cancelzc'+i+'_info'] ? json['hotel_cancelzc'+i+'_info'] : "")+'</span></div>';
  			}
  			info_html += '</div></div>';
  			//if(json.hotel_total_price)
  			{
  				//info_html += '<div><span>合计：'+(json.hotel_total_price ? json.hotel_total_price : "")+'</span></div>';
  			}
  			//else
  			{
  				//if(isNaN(r)) r = 0;
  				if(isNaN(p_result)) p_result = 0;
  				//p_result = p_result+r;
  				info_html += '<div><span>合计：'+p_result+'</span></div>';
  			}
  			info_html += '</div>';
		}
		else if(first.indexOf('textarea_') ==0)
		{
			var name = '付款情况';
  			var name_info = '付款详细信息';
  			if(className == "book_number") name = "预订号",name_info = name+'信息';
			info_html += '<div style="margin-left:6px;margin-top:2px;"><div><span><span class="class_name">'+name+'：</span>'+(json.textarea_base ? json.textarea_base : "")+'</span></div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('simple_')==0)
		{
			if(className == "hotel_sidao") return;
			var name = "预订号";
  			if(className == "bus_company") name = "车公司";
  			else if(className == "bus_use_time") name = "用车时间";
  			else if(className == "xingcheng") name = "行程"
  			else if(className == "hotel_sidao") name = "其他";
			info_html += '<div style="margin-left:6px;margin-top:2px;"><div><span><span class="class_name">'+name+'：</span>'+(json.simple_base ? json.simple_base : "")+'</span></div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('other_')==0)
		{
			if(!json.other_base_dm) return;
			info_html += '<div style="margin-left:6px;margin-top:2px;">';
  			info_html += '<div><span>酒店名：'+(json.other_base_dm ? json.other_base_dm : "")+'</span></div>';
  			info_html += '<div><span>星级：'+(json.other_xingji ? json.other_xingji : "")+'</span></div>';
  			info_html += '<div><span>地址：'+(json.other_address ? json.other_address : "")+'</span></div>';
  			info_html += '<div><span>单间价：'+(json.other_single_price ? json.other_single_price : "")+'</span>';
  			info_html += '<span style="margin-left:10px;">单间数量：'+(json.other_single_num ? json.other_single_num : "")+'</span></div>';
  			info_html += '<div><span>双间价：'+(json.other_double_price ? json.other_double_price : "")+'</span>';
  			info_html += '<span style="margin-left:10px;">双间数量：'+(json.other_double_num ? json.other_double_num : "")+'</span></div>';
  			info_html += '<div><span>说明：'+(json.other_base_shuoming ? json.other_base_shuoming : "")+'</span></div>';
  			info_html += '<div><span>小计：'+(json.other_small_price ? json.other_small_price : "")+'</span></div>';
  			info_html += '<div><span>其他报价：'+(json.other_baojie ? json.other_baojie : "")+'</span>';
  			 var r='';
  			if(json.other_baojie)
  			{
  				var expression = getExpression(json.other_baojie);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div>取消政策：<div style="margin-left:15px;">';
  			for(var i=1;i<=5;i++)
  			{
  				info_html += '<div><span>'+i+'：'+(json['other_cancelzc'+i+'_day'] ? json['other_cancelzc'+i+'_day'] : "")+'天内，退款';
  				info_html += ''+(json['other_cancelzc'+i+'_bfb'] ? json['other_cancelzc'+i+'_bfb'] : "")+'％，说明：';
  				info_html += ''+(json['other_cancelzc'+i+'_info'] ? json['other_cancelzc'+i+'_info'] : "")+'</span></div>';
  			}
  			info_html += '</div></div>';
  			info_html += '<div><span>合计：'+(json.other_total_price ? json.other_total_price : "")+'</span></div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('bus_')==0)
		{
			info_html += '<div style="margin-left:6px;margin-top:2px;"><div><span>车公司：'+(json.bus_base ? json.bus_base : "")+'</span></div>';
			info_html += '<div><span>司机：'+(json.bus_driver ? json.bus_driver : "")+'</span></div>';
			info_html += '<div><span>地址：'+(json.bus_address ? json.bus_address : "")+'</span></div>';
			info_html += '<div><span>电话：'+(json.bus_phone ? json.bus_phone : "")+'</span></div>';
			info_html += '<div><span>电邮：'+(json.bus_email ? json.bus_email : "")+'</span></div>';
			info_html += '<div><span>价格：'+(json.bus_price ? json.bus_price : "")+'</span>';
  			 var r='';
  			if(json.bus_price)
  			{
  				var expression = getExpression(json.bus_price);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
			info_html += '<div><span>其他：'+(json.bus_other ? json.bus_other : "")+'</span></div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('lunch_') == 0 || first.indexOf('dinner_')==0 || first.indexOf('breakfast_')==0)
		{
			info_html += '<div style="margin-left:6px;margin-top:2px;">';//'<div><span>B早餐：'+(json.breakfast_base ? json.breakfast_base : "")+'</span></div>';
  			//info_html += '<div><span>早餐注释：'+(json.breakfast_info ? json.breakfast_info : "")+'</span></div>';
  			info_html += '<div><span>L午餐：'+(json.lunch_base ? json.lunch_base : "")+'</span></div>';
  			info_html += '<div><span>午餐注释：'+(json.lunch_info ? json.lunch_info : "")+'</span></div>';
  			info_html += '<div><span>价格：'+(json.lunch_price ? json.lunch_price : "")+'</span>';
  			var r='';
  			if(json.lunch_price)
  			{
  				var expression = getExpression(json.lunch_price);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '<div><span>D晚餐：'+(json.dinner_base ? json.dinner_base : "")+'</span></div>';
  			info_html += '<div><span>晚餐注释：'+(json.dinner_info ? json.dinner_info : "")+'</span></div>';
  			info_html += '<div><span>价格：'+(json.dinner_price ? json.dinner_price : "")+'</span>';
  			r='';
  			if(json.dinner_price)
  			{
  				var expression = getExpression(json.dinner_price);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			if(r) info_html += '<span style="width:15%">='+r+'</span>';
  			info_html += '</div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('jingdian')==0)
		{
			info_html += '<div class="jingdian_fixed" style="background-color:rgba(238, 238, 238, 0.8);width:'+(w-18)+'px;z-index:3;"><label style="margin-left:6px;font-size:18px;">景点门票信息</label></div><div style="margin-left:6px;"><div style="margin-left:6px;">';
  			for(var i=1;i<=5;i++)
  			{
  				if(json['jingdian'+i+'_base'])
  				{
  					info_html +='<div><span>'+i+'、名称：'+(json['jingdian'+i+'_base'] ? json['jingdian'+i+'_base'] : "")+'</span></div>';
  					info_html +='<div>活动时间：<div style="margin-left:8px;">';
  					info_html +='<div>开始时间：'+(json['jingdian'+i+'_xq_hdsj_start'] ? json['jingdian'+i+'_xq_hdsj_start'] : "")+'</div>';
  					info_html +='<div>结束时间：'+(json['jingdian'+i+'_xq_hdsj_end'] ? json['jingdian'+i+'_xq_hdsj_end'] : "")+'</div></div></div>';
  					info_html +='<div>最晚付款时间：'+(json['jingdian'+i+'_xq_zwfksj'] ? json['jingdian'+i+'_xq_zwfksj'] : "")+'</div>';
  					info_html +='<div>价格：'+(json['jingdian'+i+'_xq_price'] ? json['jingdian'+i+'_xq_price'] : "")+'';
  					var r = '';
  					if(json['jingdian'+i+'_xq_price'])
  					{
  						var expression = getExpression(json['jingdian'+i+'_xq_price']);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					if(r) info_html += '<span style="width:15%">='+r+'</span>';
  					info_html += '</div>';
  					info_html +='<div>预订号：'+(json['jingdian'+i+'_xq_ydh'] ? json['jingdian'+i+'_xq_ydh'] : "")+'</div>';
  					info_html +='<div>结算情况：'+(json['jingdian'+i+'_xq_jsqk'] ? json['jingdian'+i+'_xq_jsqk'] : "")+'</div>';
  					info_html +='<div>其他：'+(json['jingdian'+i+'_xq_other'] ? json['jingdian'+i+'_xq_other'] : "")+'</div>';
  				}

  			}
  			info_html +='</div></div>';
		}
		else if(first.indexOf('hb_')==0)
		{
			if(json.hb_arrive1_base_hbh|| json.hb_arrive2_base_hbh|| json.hb_arrive3_base_hbh|| json.hb_arrive4_base_hbh|| json.hb_arrive5_base_hbh)
			{
				info_html += '<div style="margin-left:10px;margin-top:10px;" class="hb_arrive_div"><span style="font-size:20px;font-weight:bold;">抵达：</span><div style="margin-left:6px;">';
			}
			for(var i=1;i<=5;i++)
  			{
  				if(json['hb_arrive'+i+'_base_hbh'])
  				{
  					info_html += '<div>'+i+'、航班号：'+(json['hb_arrive'+i+'_base_hbh'] ? json['hb_arrive'+i+'_base_hbh'] : "")+'</div>';
  					info_html += '<div>日期：'+(json['hb_arrive'+i+'_base_date'] ? json['hb_arrive'+i+'_base_date'] : "")+'</div>';
  					info_html += '<div>两端机场代码缩写：'+(json['hb_arrive'+i+'_base_code'] ? json['hb_arrive'+i+'_base_code'] : "")+'</div>';
  					info_html += '<div>起飞时间：'+(json['hb_arrive'+i+'_base_qfsj'] ? json['hb_arrive'+i+'_base_qfsj'] : "")+'</div>';
  					info_html += '<div>抵达时间：'+(json['hb_arrive'+i+'_base_ddsj'] ? json['hb_arrive'+i+'_base_ddsj'] : "")+'</div>';
  					info_html += '<div>价格：'+(json['hb_arrive'+i+'_info_price'] ? json['hb_arrive'+i+'_info_price'] : "")+'';
  					var r = '';
  					if(json['hb_arrive'+i+'_info_price'])
  					{
  						var expression = getExpression(json['hb_arrive'+i+'_info_price']);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					if(r) info_html +='<span style="width:15%">='+r+'</span>';
  					info_html += '</div>';
  					info_html += '<div>预订号：'+(json['hb_arrive'+i+'_info_ydh'] ? json['hb_arrive'+i+'_info_ydh'] : "")+'</div>';
  					info_html += '<div>结算情况：'+(json['hb_arrive'+i+'_info_jsqk'] ? json['hb_arrive'+i+'_info_jsqk'] : "")+'</div>';
  				}
  			}
  			info_html += '</div></div>';

  			if(json.hb_leave1_base_hbh|| json.hb_leave2_base_hbh|| json.hb_leave3_base_hbh|| json.hb_leave4_base_hbh|| json.hb_leave5_base_hbh)
  			{
  				info_html += '<div style="margin-left:10px;margin-top:10px;" class="hb_leave_div"><span style="font-size:20px;font-weight:bold;">离开：</span><div style="margin-left:6px;">';
  			}
  			for(var i=1;i<=5;i++)
  			{
  				if(json['hb_leave'+i+'_base_hbh'])
  				{
  					info_html += '<div>'+i+'、航班号：'+(json['hb_leave'+i+'_base_hbh'] ? json['hb_leave'+i+'_base_hbh'] : "")+'</div>';
  					info_html += '<div>日期：'+(json['hb_leave'+i+'_base_date'] ? json['hb_leave'+i+'_base_date'] : "")+'</div>';
  					info_html += '<div>两端机场代码缩写：'+(json['hb_leave'+i+'_base_code'] ? json['hb_leave'+i+'_base_code'] : "")+'</div>';
  					info_html += '<div>起飞时间：'+(json['hb_leave'+i+'_base_qfsj'] ? json['hb_leave'+i+'_base_qfsj'] : "")+'</div>';
  					info_html += '<div>抵达时间：'+(json['hb_leave'+i+'_base_ddsj'] ? json['hb_leave'+i+'_base_ddsj'] : "")+'</div>';
	  				info_html += '<div>价格：'+(json['hb_leave'+i+'_info_price'] ? json['hb_leave'+i+'_info_price'] : "")+'';
  					var r = '';
  					if(json['hb_leave'+i+'_info_price'])
  					{
  						var expression = getExpression(json['hb_leave'+i+'_info_price']);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					if(r) info_html +='<span style="width:15%">='+r+'</span>';
  					info_html += '</div>';
  					info_html += '<div>预订号：'+(json['hb_leave'+i+'_info_ydh'] ? json['hb_leave'+i+'_info_ydh'] : "")+'</div>';
  					info_html += '<div>结算情况：'+(json['hb_leave'+i+'_info_jsqk'] ? json['hb_leave'+i+'_info_jsqk'] : "")+'</div>';
  				}
  			}

  			info_html += '</div></div>';
		}
		else if(first.indexOf('line_')==0)
		{
			var name = '费用包含';
  			var name_info = '费用包含';
  			if(className == "line_fee_nin") name = "费用不包含",name_info = name;
  			else if(className == "line_note") name = "注意事项",name_info = name;
  			else if(className == "line_fjxy") name = "附加协议",name_info = name;
			info_html += '<div style="margin-left:6px;margin-top:2px;"><div><span><span class="class_name">'+name+'：</span>'+(json[className] ? json[className] : "")+'</span></div>';
  			info_html += '</div>';
		}
		else if(first.indexOf('gys_')==0)
		{
			info_html += '<div style="margin-left:6px;margin-top:2px;">';
			info_html += '<div><span>供应商名称：'+(json.gys_name ? json.gys_name : "")+'</span></div>';
			info_html += '<div><span>地接社名称：'+(json.gys_dj ? json.gys_dj : "")+'</span></div>';
			info_html += '<div><span>负责人：'+(json.gys_fuzeren ? json.gys_fuzeren : "")+'</span></div>';
			info_html += '<div><span>联系电话：'+(json.gys_phone ? json.gys_phone : "")+'</span></div>';
  			info_html += '</div>';
		}
		if(info_html.length>0)
		{
  			$(div).append(info_html);
  			$("body").append(div);
  			var div_h = $(div).height();
  			if(top + div_h >height) top = $(e).position().top - div_h+20;
  			if(top<0)
  			{
  				//console.log(top);
  				top = 0;
  				$(div).css({'left':($(e).position().left-w+10)+'px'});
  			}
  			$(div).css({'top':top+'px'});
  		}
  	}
  }
  function showDiv(e)//导游
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background-color','white');
  	$(".mouse_show_div").remove();
  	$(".tablesimple").hide();
  	$(".tablehotel").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	var div = $(".tablecontainer");
  	//console.log($(e).position());
  	//console.log($(e).offset());
  	//console.log($('#'+id).scrollTop());
  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.showdiv_fixed');
  	  	var next = $(fixed).next();
  	  	$(div).find('.showdiv_fixed').remove();
  	  	if(json.th_base_name)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else
  	  			{
  	  				$("."+key).val('');
  	  			}
  	  			if(key == 'th_gongzi' || key == 'th_fee' || key == 'th_cfbz' || key == 'th_df')
  	  			{
  	  				var input = $(div).find("."+key).get(0);
  	  				if(input)
  	  				{
  	  					computeResult($(input));
  	  				}
  	  				//computeResult($("."+key));
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class') == 'th_gongzi' || $(this).attr('class') == 'th_fee' || $(this).attr('class') == 'th_cfbz' || $(this).attr('class') == 'th_df')
  	  			{
  	  				computeResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	  	$(next).before(fixed);
  	}
  	else
  	{//onPropertyChange="window.computeResult(this)"
  		div = document.createElement("div");
  		div.setAttribute("class","tablecontainer");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top:'+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:6px;margin-top:2px;"><div><span>姓名：<input style="width:75%;" placeholder="姓名" class="th_base_name" value="'+(json.th_base_name ? json.th_base_name.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>城市：<input style="width:75%;" placeholder="城市" class="th_base_city" value="'+(json.th_base_city ? json.th_base_city.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>电话：<input style="width:75%;" placeholder="电话" class="th_xmdh" value="'+(json.th_xmdh ? json.th_xmdh.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>工资：<input style="width:75%;" placeholder="工资" onblur="window.computeResult(this)" class="th_gongzi" value="'+(json.th_gongzi ? json.th_gongzi.replace(/"/g,'&quot;') : "")+'" /></span>';
  		var r='';
  		if(json.th_gongzi)
  		{
  			var expression = getExpression(json.th_gongzi);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div><span>小费：<input style="width:75%;" placeholder="小费" onblur="window.computeResult(this)" class="th_fee" value="'+(json.th_fee ? json.th_fee.replace(/"/g,'&quot;') : "")+'" /></span>';
  		r='';
  		if(json.th_fee)
  		{
  			var expression = getExpression(json.th_fee);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div><span>餐补：<input style="width:75%;" placeholder="餐补" onblur="window.computeResult(this)" class="th_cfbz" value="'+(json.th_cfbz ? json.th_cfbz.replace(/"/g,'&quot;') : "")+'" /></span>';
  		r='';
  		if(json.th_cfbz)
  		{
  			var expression = getExpression(json.th_cfbz);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div><span>垫付：<input style="width:75%;" placeholder="垫付" onblur="window.computeResult(this)" class="th_df" value="'+(json.th_df ? json.th_df.replace(/"/g,'&quot;') : "")+'" /></span>';
  		r='';
  		if(json.th_df)
  		{
  			var expression = getExpression(json.th_df);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div><span>合计：<input style="width:75%;" readonly="readonly" class="th_total" value="'+(json.th_total ? json.th_total : "")+'" /></span></div>';
  		info_html += '<div><span>结算：<textarea style="margin-left:10px;width:95%;height:'+((h-240)>120 ?(h-240):120)+'px;" placeholder="结算" class="th_jiesuan">'+(json.th_jiesuan ? json.th_jiesuan : "")+'</textarea></span></div>';//
  		info_html += '<div><span>报价：<textarea style="margin-left:10px;width:95%;height:'+((h-260)>100 ?(h-260):100)+'px;" placeholder="报价" class="th_baojie">'+(json.th_baojie ? json.th_baojie : "")+'</textarea></span></div>';
  		//info_html += '<div><span>报价：<input style="width:85%;" placeholder="报价"  class="th_baojie" value="'+(json.th_baojie ? json.th_baojie : "")+'"/></span></div>';
  		info_html += '</div>';

  		//info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="text-align: center;height:26px;"></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.th_base_name')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showDiv = showDiv;
  function clickHotelList(e)
  {
    if($(e).is("li"))
    {
    	var text = $(e).text();
    	var hotel_info = {};
    	for(var i in findHotels)
    	{
    		var h = findHotels[i];
    		if(h.hotel_base_dm == text)
    		{
    			hotel_info = h;
    			break;
    		}
    	}
    	var className = $(currentShowDiv).attr('class');
    	if(className == "tablehotel")
    	{
    		$(currentShowDiv).find('input').each(function(){
    			var cln = $(this).attr('class');
    			if(hotel_info[cln]) $(this).val(hotel_info[cln]);
    			if(cln == 'hotel_baojie')
  	  			{
  	  				var input = $(currentShowDiv).find("."+cln).get(0);
  	  				if(input)
  	  				{
  	  					computeResult($(input));
  	  				}
  	  			}
  	  			if(cln == 'hotel_single_price' || cln == 'hotel_double_price')
  	  			{
  	  				var input = $(currentShowDiv).find("."+cln).get(0);
  	  				if(input)
  	  				{
  	  					computeHotelPrice($(input));
  	  				}
  	  			}
    		});
    	}
    	else if(className == "tablehotelother")
    	{
    		$(currentShowDiv).find('input').each(function(){
    			var cln = $(this).attr('class');
    			cln = cln.replace('other_','hotel_');
    			if(hotel_info[cln]) $(this).val(hotel_info[cln]);
    			if($(this).attr('class') == 'other_baojie')
  	  			{
  	  				var input = $(currentShowDiv).find("."+cln).get(0);
  	  				if(input)
  	  				{
  	  					computeResult($(input));
  	  				}
  	  			}
  	  			if($(this).attr('class') == 'other_single_price' || $(this).attr('class') == 'other_double_price')
  	  			{
  	  				var input = $(currentShowDiv).find("."+cln).get(0);
  	  				if(input)
  	  				{
  	  					computeHotelPrice($(input));
  	  				}
  	  			}
    		});
    	}
    	/*for(var key in hotel_info)
  	  	{
  	  		if(key == "hotel_base_xc") continue;
  	  		$("."+key).val(hotel_info[key]);
  	  	}//*/

    	//$(e).parent().parent().parent().parent().remove();
    }
    else
    {
    	$(e).parent().parent().parent().remove();
    }
  }
  window.clickHotelList = clickHotelList;
  function findHotel(value,e)
  {
  	if(timeOutSearch) clearTimeout(timeOutSearch),timeOutSearch = null;
  	Meteor.call('findHotel',value,function(error,result){
  		//console.log(result);
  		if(error) return;
  		$('.hotelsearch').remove();
  		if(result.length == 0) return;
  		findHotels = result;
  		var e_parent = $(e).parent().parent().parent();
  		e_parent = $(e_parent).parent();
  		var w = $(e_parent).width();
  		var top = $(e).position().top;
  		if($(e).is('input')) top += $(e).height()+9;
  		else top += ($(e).height()+9)*2;
  		var div = document.createElement("div");
  		div.setAttribute("class","hotelsearch");
  		$(div).css({'position':'absolute','z-index': 399999,'display':'block','top':top+'px',
  					'background-color':'rgba(255, 255, 255, 0.75)','width':(w-90),'height':"auto",'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'3px','border-radius':'3px'});
  		var info_html = '<div style="margin-left:6px;"><div style="background:rgb(246,246,246);"><span class="s_close" style="margin-left:'+(w-90-45)+'px;cursor:pointer;" onclick="window.clickHotelList(this)">关闭</span></div>';
  		info_html += '<div style="height:150px;overflow:auto;"><ul>';
  		for(var i in result)
  		{
  			h = result[i];
  			info_html += '<li onclick="window.clickHotelList(this)" class="s_li" style="cursor:pointer;height:23px;margin-top:5px;">'+h.hotel_base_dm+'</li><li style="margin:0px; padding:0px; font-size:0px; height:1px; overflow:hidden; background:#e5e5e5;"></li>';
  		}
  		info_html += '</ul></div></div>';
  		$(div).append(info_html);
  		$(e).parent().after(div);
  	});
  }
  function inputSearch(e)
  {
  	var value = $(e).val();
  	if(!value) return;
  	if(timeOutSearch) clearTimeout(timeOutSearch),timeOutSearch = null;
  	timeOutSearch = setTimeout(function()
  	{
  		findHotel(value,e);
  	},800);
  }
  window.inputSearch = inputSearch;
  function searchHotel(e)
  {
  	var input = $(e).next();
  	if(!input) return;
  	var value = $(input).val();
  	if(!value) return;
  	findHotel(value,e);
  }
  window.searchHotel = searchHotel;
  function computeHotelPrice(t)
  {
  	var t_cls = $(t).attr("class");
  	if(t_cls.indexOf('hotel_') == 0)
  	{
  		var div = $(t).parent().parent().parent().parent();
  		var rid = $(div).attr("id");
  		var day = $(div).attr("data-day");
  		var r = findRoomByRid(rid);
  		if(r && r.ext && r.ext.days)
  		{
  			if(r.ext.days[day])
  			{
  				var d_num = r.ext.days[day].hotel_double ? r.ext.days[day].hotel_double : 0;
  				var s_num = r.ext.days[day].hotel_single ? r.ext.days[day].hotel_single : 0;
  				var result = '';
  				var s_price = $(t).parent().parent().find(".hotel_single_price").get(0);
  				var d_price = $(t).parent().parent().find(".hotel_double_price").get(0);
  				result = eval(($(d_price).val()?$(d_price).val():0)+'*'+d_num +'+'+ ($(s_price).val()?$(s_price).val():0)+'*'+s_num);
  				var small_price = $(div).find(".hotel_small_price").get(0);
  				if(small_price)
  				{
  					$(small_price).val(result);
  				}
  				var other_price = $(div).find(".hotel_baojie").get(0);
  				if(other_price)
  				{
  					var span = $(other_price).parent().next();
  					var span_text = $(span).text().replace('=','');
  					if(span_text.length>0)
  					{
  						result = eval(result+'+'+span_text);
  					}
  				}
  				var total_price = $(div).find(".hotel_total_price").get(0);
  				if(total_price)
  				{
  					$(total_price).val(result);
  				}
  			}
  		}
  	}
  	else if(t_cls.indexOf('other_') == 0)
  	{
  		var div = $(t).parent().parent().parent();
  		var s_price = $(div).find(".other_single_price").get(0);
  		var d_price = $(div).find(".other_double_price").get(0);
  		var result = '';
  		var d_num = $(div).find(".other_double_num").get(0);
  		var s_num = $(div).find(".other_single_num").get(0);
  		result = eval(($(s_price).val()?$(s_price).val():0)+'*'+($(s_num).val()?$(s_num).val():0) +'+'+ ($(d_num).val()?$(d_num).val():0)+'*'+($(d_price).val()?$(d_price).val():0));
  		var small_price = $(div).find(".other_small_price").get(0);
  		if(small_price)
  		{
  			$(small_price).val(result);
  		}
  		var other_price = $(div).find(".other_baojie").get(0);
  		if(other_price)
  		{
  			var span = $(other_price).parent().next();
  			var span_text = $(span).text().replace('=','');
  			if(span_text.length>0)
  			{
  				result = eval(result+'+'+span_text);
  			}
  		}
  		var total_price = $(div).find(".other_total_price").get(0);
  		if(total_price)
  		{
  			$(total_price).val(result);
  		}
  	}
  }
  window.computeHotelPrice = computeHotelPrice;
  function showHotelDiv(e)//酒店信息
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background-color','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	//console.log(r);
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	var div = $(".tablehotel");
  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  		$('.hotelsearch').remove();
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.showdiv_fixed');
  	  	var next = $(fixed).next();
  	  	$(div).find('.showdiv_fixed').remove();
  	  	if(json.hotel_base_dm)//json.hotel_base_xc ||
  	  	{
  	  		if(!json.hotel_phone) json.hotel_phone = '';
  	  		if(!json.hotel_email) json.hotel_email = '';
  	  		if(!json.hotel_single_price) json.hotel_single_price = '';
  	  		if(!json.hotel_double_price) json.hotel_double_price = '';
  	  		if(!json.hotel_small_price) json.hotel_small_price = '';
  	  		if(!json.hotel_total_price) json.hotel_total_price = '';
  	  		var t_price = '';
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  				if(key == 'hotel_small_price')
  	  				{
  	  					var input = $(div).find(".hotel_double_price").get(0);
  	  					if(input)
  	  					{
  	  						computeHotelPrice($(input));
  	  						var hsp = $(div).find("."+key).get(0);
  	  						if(hsp)
  	  						{
  	  							if(t_price.length>0) t_price = t_price+'+'+ ($(hsp).val()?$(hsp).val():'0');
  	  							else t_price = $(hsp).val()?$(hsp).val():'0';
  	  						}
  	  					}
  	  				}
  	  			}
  	  			else
  	  			{
  	  				$("."+key).val('');
  	  			}
  	  			if(key == 'hotel_baojie')
  	  			{
  	  				var input = $(div).find("."+key).get(0);
  	  				if(input)
  	  				{
  	  					computeResult($(input));
  	  					var span_text = $(input).parent().next().text().replace('=','');
  	  					if(t_price.length>0) t_price = t_price+'+'+(span_text?span_text:'0');
  	  					else t_price = span_text?span_text:'0';
  	  				}
  	  			}
  	  		}
  	  		if(t_price.length>0)
  	  		{
  	  			var r = eval(t_price);
  	  			if(!isNaN(r))
  	  			{
  	  				var input = $(div).find(".hotel_total_price").get(0);
  	  				if(input) $(input).val(r);
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class') == 'hotel_baojie')
  	  			{
  	  				computeResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	  	$(next).before(fixed);
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tablehotel");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top:'+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:6px;margin-top:2px;">';
  		//info_html += '<div><span>行程：<input style="width:96.5%;" placeholder="行程" class="hotel_base_xc" value="'+(json.hotel_base_xc ? json.hotel_base_xc.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>酒店名：<button style="margin-left:15px;" onclick="window.searchHotel(this)">查找</button><input style="width:96.5%;" placeholder="酒店名" onkeyup="window.inputSearch(this)" class="hotel_base_dm" value="'+(json.hotel_base_dm ? json.hotel_base_dm.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>星级：<input style="width:96.5%;" placeholder="星级" class="hotel_xingji" value="'+(json.hotel_xingji ? json.hotel_xingji.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>地址：<input style="width:96.5%;" placeholder="地址" class="hotel_address" value="'+(json.hotel_address ? json.hotel_address.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>电话：<input style="width:96.5%;" placeholder="电话" class="hotel_phone" value="'+(json.hotel_phone ? json.hotel_phone.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>电邮：<input style="width:96.5%;" placeholder="电邮" class="hotel_email" value="'+(json.hotel_email ? json.hotel_email.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>双间价：<input style="width:90px;" placeholder="双间价" onblur="window.computeHotelPrice(this)" class="hotel_double_price" value="'+(json.hotel_double_price ? json.hotel_double_price.replace(/"/g,'&quot;') : "")+'" /></span>';
  		info_html += '<span style="margin-left:5px;">单间价：<input style="width:90px;" placeholder="单间价" onblur="window.computeHotelPrice(this)" class="hotel_single_price" value="'+(json.hotel_single_price ? json.hotel_single_price.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		var t_result = 0;
  		/*if(json.hotel_small_price && json.hotel_small_price != "0")
  		{
  			info_html += '<div><span>小计：<input style="width:75%;" readonly="readonly" class="hotel_small_price" value="'+(json.hotel_small_price ? json.hotel_small_price : "")+'" /></span></div>';
  			t_result = json.hotel_small_price;
  		}
  		else//*/
  		{
  			var p_result = 0;
  			var d_price = json.hotel_double_price ? json.hotel_double_price : '';
  			var s_price = json.hotel_single_price ? json.hotel_single_price : '';
  			if(d_price.length >0 || s_price.length > 0)
  			{
  				if(s_price.length==0) s_price = 0;
  				if(d_price.length==0) d_price = 0;
  				var d_num = r.ext.days[day].hotel_double ? r.ext.days[day].hotel_double : 0;
  				var s_num = r.ext.days[day].hotel_single ? r.ext.days[day].hotel_single : 0;
  				p_result = eval(d_num+'*'+d_price+'+'+s_num+'*'+s_price);
  				if(isNaN(p_result)) p_result='';
  			}
  			else p_result='';
  			t_result = p_result?p_result:0;
  			info_html += '<div><span>小计：<input style="width:75%;" readonly="readonly" class="hotel_small_price" value="'+p_result+'" /></span></div>';
  		}
  		//info_html += '<div><span>报价：<textarea style="margin-left:10px;width:95%;height:120px;" placeholder="报价信息" class="hotel_baojie">'+(json.hotel_baojie ? json.hotel_baojie : "")+'</textarea></span></div>';
  		info_html += '<div><span>其他报价：<input style="width:180px;" placeholder="其他报价" onblur="window.computeResult(this)" class="hotel_baojie" value="'+(json.hotel_baojie ? json.hotel_baojie.replace(/"/g,'&quot;') : "")+'" /></span>';
  		var r='';
  		if(json.hotel_baojie)
  		{
  			var expression = getExpression(json.hotel_baojie);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  			else
  			{
  				t_result = eval(t_result+'+'+r);
  				if(isNaN(t_result)) t_result='';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>取消政策：';
  		for(var i=1;i<=5;i++)
  		{
  			info_html += '<div><span>'+i+'：<input style="width:30px;" placeholder="天数" class="hotel_cancelzc'+i+'_day" value="'+(json['hotel_cancelzc'+i+'_day'] ? json['hotel_cancelzc'+i+'_day'] : "")+'" />天内，退款';
  			info_html += '<input style="width:30px;" placeholder="数字" class="hotel_cancelzc'+i+'_bfb" value="'+(json['hotel_cancelzc'+i+'_bfb'] ? json['hotel_cancelzc'+i+'_bfb'] : "")+'" />％，说明：';
  			info_html += '<input style="width:90px;" placeholder="说明" class="hotel_cancelzc'+i+'_info" value="'+(json['hotel_cancelzc'+i+'_info'] ? json['hotel_cancelzc'+i+'_info'].replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		}
  		info_html += '</div>';//json.hotel_total_price ? json.hotel_total_price : ""
  		info_html += '<div><span>合计：<input style="width:75%;" readonly="readonly" class="hotel_total_price" value="'+(t_result)+'" /></span></div>';

  		info_html += '</div>';

  		//info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="text-align: center;height:26px;"></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.hotel_base_dm')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showHotelDiv = showHotelDiv;
  function showHotelOtherDiv(e)//其他信息
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background-color','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotel").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	//console.log(r);
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	var div = $(".tablehotelother");
  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  		$('.hotelsearch').remove();
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.showdiv_fixed');
  	  	var next = $(fixed).next();
  	  	$(div).find('.showdiv_fixed').remove();
  	  	if(json.other_base_dm)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else $("."+key).val('');
  	  			if(key == 'other_baojie')
  	  			{
  	  				var input = $(div).find("."+key).get(0);
  	  				if(input)
  	  				{
  	  					computeResult($(input));
  	  				}
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class') == 'other_baojie')
  	  			{
  	  				computeResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	  	$(next).before(fixed);
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tablehotelother");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top:'+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:6px;margin-top:2px;">';
  		info_html += '<div><span>酒店名：<button style="margin-left:15px;" onclick="window.searchHotel(this)">查找</button><input style="width:96.5%;" placeholder="酒店名" onkeyup="window.inputSearch(this)" class="other_base_dm" value="'+(json.other_base_dm ? json.other_base_dm.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>星级：<input style="width:96.5%;" placeholder="星级" class="other_xingji" value="'+(json.other_xingji ? json.other_xingji.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>地址：<input style="width:96.5%;" placeholder="地址" class="other_address" value="'+(json.other_address ? json.other_address.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>单间价：<input style="width:30%;" placeholder="单间价" class="other_single_price" value="'+(json.other_single_price ? json.other_single_price.replace(/"/g,'&quot;') : "")+'" /></span>';
  		info_html += '<span style="margin-left:7px;">数量：<input style="width:30%;" placeholder="单间数量" onblur="window.computeHotelPrice(this)" class="other_single_num" value="'+(json.other_single_num ? json.other_single_num.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>双间价：<input style="width:30%;" placeholder="双间价" class="other_double_price" value="'+(json.other_double_price ? json.other_double_price.replace(/"/g,'&quot;') : "")+'" /></span>';
  		info_html += '<span style="margin-left:7px;">数量：<input style="width:30%;" placeholder="双间数量"  onblur="window.computeHotelPrice(this)" class="other_double_num" value="'+(json.other_double_num ? json.other_double_num.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>小计：<input style="width:75%;" readonly="readonly" class="other_small_price" value="'+(json.other_small_price ? json.other_small_price : "")+'" /></span></div>';
  		info_html += '<div><span>说明：<input style="width:75%;" placeholder="说明" class="other_base_shuoming" value="'+(json.other_base_shuoming ? json.other_base_shuoming : "")+'" /></span></div>';
  		//info_html += '<div><span>报价：<textarea style="margin-left:10px;width:95%;height:120px;" placeholder="报价信息" class="hotel_baojie">'+(json.hotel_baojie ? json.hotel_baojie : "")+'</textarea></span></div>';
  		info_html += '<div><span>其他报价：<input style="width:180px;" placeholder="其他报价" onblur="window.computeResult(this)" class="other_baojie" value="'+(json.other_baojie ? json.other_baojie.replace(/"/g,'&quot;') : "")+'" /></span>';
  		var r='';
  		if(json.other_baojie)
  		{
  			var expression = getExpression(json.other_baojie);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>取消政策：';
  		for(var i=1;i<=5;i++)
  		{
  			info_html += '<div><span>'+i+'：<input style="width:30px;" placeholder="天数" class="other_cancelzc'+i+'_day" value="'+(json['other_cancelzc'+i+'_day'] ? json['other_cancelzc'+i+'_day'] : "")+'" />天内，退款';
  			info_html += '<input style="width:30px;" placeholder="数字" class="other_cancelzc'+i+'_bfb" value="'+(json['other_cancelzc'+i+'_bfb'] ? json['other_cancelzc'+i+'_bfb'] : "")+'" />％，说明：';
  			info_html += '<input style="width:90px;" placeholder="说明" class="other_cancelzc'+i+'_info" value="'+(json['other_cancelzc'+i+'_info'] ? json['other_cancelzc'+i+'_info'].replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		}
  		info_html += '</div>';//*/
  		info_html += '<div><span>合计：<input style="width:75%;" readonly="readonly" class="other_total_price" value="'+(json.other_total_price ? json.other_total_price : "")+'" /></span></div>';

  		info_html += '</div>';

  		//info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="text-align: center;height:26px;"></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.other_base_dm')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showHotelOtherDiv = showHotelOtherDiv;
  function showTextAreaDiv(e)//多行文本
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tablesimple").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tabledinner").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	var div = $(".tableTextAreaDiv");
  	var name = '付款情况';
  	var name_info = '付款详细信息';
  	if($(e).attr("class") == "book_number") name = "预订号",name_info = name+'信息';

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	if(json.textarea_base)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0) $("."+key).val(json[key]);
  	  			else $("."+key).val(''),$("."+key).attr('placeholder',name_info);
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			$(this).attr('placeholder',name_info);
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  			$(this).attr('placeholder',name_info);
  	  		});
  	  	}
  	  	$($(div).find(".class_name")[0]).text(name+'：');
  	  	$(div).show();
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tableTextAreaDiv");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;"><div><span><span class="class_name">'+name+'：</span><textarea style="margin-left:10px;width:95%;height:'+((h-60)>150 ?(h-60):150)+'px;" placeholder="'+name_info+'" class="textarea_base">'+(json.textarea_base ? json.textarea_base : "")+'</textarea></span></div>';
  		info_html += '</div>';
  		info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$($(div).find('.textarea_base')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showTextAreaDiv = showTextAreaDiv;
  function showSimpleDiv(e)//单个Div
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	if(!json.simple_base && className == "xingcheng")
  	{
  		if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day]['hotel_name'])
  		{
  			json.simple_base = r.ext.days[day]['hotel_name'].hotel_base_xc;
  		}
  	}
  	var div = $(".tablesimple");
  	var name = "预订号";
  	if($(e).attr("class") == "bus_company") name = "车公司";
  	else if($(e).attr("class") == "bus_use_time") name = "用车时间";
  	else if($(e).attr("class") == "xingcheng") name = "行程"
  	else if($(e).attr("class") == "hotel_sidao") name = "其他";

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = 90;//height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	if(json.simple_base)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else $("."+key).val(''),$("."+key).attr('placeholder',name);
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			$(this).attr('placeholder',name);
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  			$(this).attr('placeholder',name);
  	  		});
  	  	}
  	  	$($(div).find(".class_name")[0]).text(name+'：');
  	  	$(div).show();
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tablesimple");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;"><div><span><span class="class_name">'+name+'：</span><input style="margin-left:10px;width:95%;" placeholder="'+name+'" class="simple_base" value="'+(json.simple_base ? json.simple_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '</div>';

  		info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$($(div).find('.simple_base')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showSimpleDiv = showSimpleDiv;
  function showBusDiv(e)//车公司
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablesimple").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  		if(!json.bus_base && json.simple_base)
		{
			json.bus_base = json.simple_base;
			delete json.simple_base;
		}
  	}
  	else json.bus_base = '';
  	if(!json.bus_driver && r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day]['driver'])
  	{
  		if(!json.bus_base) json.bus_base = '';
  		json.bus_driver = r.ext.days[day]['driver'].simple_base?r.ext.days[day]['driver'].simple_base:"";
  	}
  	else if(!json.bus_driver) json.bus_driver = '';
  	//console.log(json);
  	var div = $(".tablebus");

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;//125;//

  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	if(json.bus_base || json.bus_driver)
  	  	{
  	  		if(!json.bus_phone) json.bus_phone = '';
  	  		if(!json.bus_email) json.bus_email = '';
  	  		if(!json.bus_address) json.bus_address = '';
  	  		if(!json.bus_price) json.bus_price = '';
  	  		if(!json.bus_other) json.bus_other = '';
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else $("."+key).val('');
  	  			if(key == 'bus_price')
  	  			{
  	  				var input = $(div).find("."+key).get(0);
  	  				if(input)
  	  				{
  	  					computeResult($(input));
  	  				}
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class') == 'bus_price')
  	  			{
  	  				computeResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tablebus");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow-y':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top:'+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:6px;margin-top:2px;"><div><span>车公司：<input style="margin-left:10px;width:95%;" placeholder="车公司" class="bus_base" value="'+(json.bus_base ? json.bus_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>司机：<input style="margin-left:10px;width:95%;" placeholder="司机" class="bus_driver" value="'+(json.bus_driver ? json.bus_driver.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>地址：<input style="margin-left:10px;width:95%;" placeholder="地址" class="bus_address" value="'+(json.bus_address ? json.bus_address.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>电话：<input style="margin-left:10px;width:95%;" placeholder="电话" class="bus_phone" value="'+(json.bus_phone ? json.bus_phone.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>电邮：<input style="margin-left:10px;width:95%;" placeholder="电邮" class="bus_email" value="'+(json.bus_email ? json.bus_email.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>价格：<input style="margin-left:10px;width:70%;" placeholder="价格" class="bus_price" onblur="window.computeResult(this)" value="'+(json.bus_price ? json.bus_price.replace(/"/g,'&quot;') : "")+'" /></span>';
  		var r='';
  		if(json.bus_price)
  		{
  			var expression = getExpression(json.bus_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html += '<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div><span>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-260)>100 ?(h-260):100)+'px;" placeholder="其他" class="bus_other">'+(json.bus_other ? json.bus_other : "")+'</textarea></span></div>';
  		info_html += '</div>';

  		//info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$($(div).find('.bus_base')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showBusDiv = showBusDiv;
  function showDinnerDiv(e)//用餐
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tablesimple").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  		if(!json.lunch_price) json.lunch_price = '';
  		if(!json.dinner_price) json.dinner_price = '';
  	}
  	var div = $(".tabledinner");

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5-90;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.showdiv_fixed');
  	  	var next = $(fixed).next();
  	  	$(div).find('.showdiv_fixed').remove();
  	  	if(json.breakfast_base || json.lunch_base || json.dinner_base)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				if(json[key].length>0)
  	  				{
  	  					$("."+key).val(json[key]);
  	  					//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  				}
  	  				else $("."+key).val('');
  	  				if(key.indexOf('_price')>0)
  	  				{
  	  					var input = $(div).find("."+key).get(0);
  	  					if(input)
  	  					{
  	  						computeJingDianAndAirPortResult($(input));
  	  					}
  	  				}
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class').indexOf('_price')>0)
  	  			{
  	  				computeJingDianAndAirPortResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	  	$(next).before(fixed);
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tabledinner");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top: '+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:6px;margin-top:2px;">';//'<div><span>B早餐：<input style="margin-left:10px;width:95%;height:30px;" placeholder="早餐" value="'+(json.breakfast_base ? json.breakfast_base : "")+'" class="breakfast_base" /></span></div>';
  		//info_html += '<div><span>早餐详情：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="早餐注释" class="breakfast_info">'+(json.breakfast_info ? json.breakfast_info : "")+'</textarea></span></div>';
  		info_html += '<div><span>L午餐：<input style="margin-left:10px;width:95%;height:30px;" placeholder="午餐" value="'+(json.lunch_base ? json.lunch_base.replace(/"/g,'&quot;') : "")+'" class="lunch_base" /></span></div>';
  		info_html += '<div><span>午餐注释：<textarea style="margin-left:10px;width:95%;height:'+((h-200)>60 ?(h-200):60)+'px;" placeholder="午餐注释" class="lunch_info">'+(json.lunch_info ? json.lunch_info : "")+'</textarea></span></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="lunch_price" value="'+(json.lunch_price ? json.lunch_price.replace(/"/g,'&quot;') : "")+'" />';
  		var r = '';
  		if(json.lunch_price)
  		{
  			var expression = getExpression(json.lunch_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div><span>D晚餐：<input style="margin-left:10px;width:95%;height:30px;" placeholder="晚餐" value="'+(json.dinner_base ? json.dinner_base.replace(/"/g,'&quot;') : "")+'" class="dinner_base"/></span></div>';
  		info_html += '<div><span>晚餐注释：<textarea style="margin-left:10px;width:95%;height:'+((h-200)>60 ?(h-200):60)+'px;" placeholder="晚餐注释" class="dinner_info">'+(json.dinner_info ? json.dinner_info : "")+'</textarea></span></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="dinner_price" value="'+(json.dinner_price ? json.dinner_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.dinner_price)
  		{
  			var expression = getExpression(json.dinner_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		//info_html += '<div><span>注释：<input style="margin-left:10px;width:95%;height:30px;" placeholder="注释" value="'+(json.lunchdinner_zhushi ? json.lunchdinner_zhushi : "")+'" class="lunchdinner_zhushi"/></span></div>';
  		info_html += '</div>';

  		//info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="text-align: center;height:26px;"></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.lunch_base')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showDinnerDiv = showDinnerDiv;
  function computeJingDianAndAirPortResult(t)
  {
  	var value = $(t).val();
  	if(value.length<=0)
  	{
  		var span = $(t).next().get(0);
  		if(span) $(span).text('=');
  	}
  	//if(value.indexOf("=")>0 || value.indexOf("＝")>0)
  	{
  		var r = 0;
  		var expression = getExpression(value);
  		if(expression.length>0)
  		{
  			r = eval(expression);
  			if(!isNaN(r))
  			{
  				//$(t).val(string+'='+r);
  				var span = $(t).next();
  				if(span.get(0) != undefined)
  				{
  					$(span).text("="+r);
  				}
  			}
  		}
  	}
  }
  window.computeJingDianAndAirPortResult = computeJingDianAndAirPortResult;
  function showJingDianDiv(e)//景点门票
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tablehotel").hide();
  	$(".tableairport").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	var div = $(".tablejingdian");

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.jingdian_fixed');
  	  	$(div).find('.jingdian_fixed').remove();
  	  	var bottom_fixed = $(div).find('.showdiv_fixed');
  	  	var next = $(bottom_fixed).next();
  	  	$(div).find('.showdiv_fixed').remove();
  	  	if(json.jingdian1_base || json.jingdian2_base|| json.jingdian3_base|| json.jingdian4_base|| json.jingdian5_base)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else $("."+key).val('');
  	  			if(key.indexOf('_price')>0)
  	  			{
  	  				var input = $(div).find("."+key).get(0);
  	  				if(input)
  	  				{
  	  					computeJingDianAndAirPortResult($(input));
  	  				}
  	  				//computeJingDianAndAirPortResult($("."+key));
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class').indexOf('_price')>0)
  	  			{
  	  				computeJingDianAndAirPortResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	  	$($(div).children('div')[0]).before(fixed);
  	  	$(next).before(bottom_fixed);
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tablejingdian");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow-y':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div class="jingdian_fixed" style="background-color:rgba(238, 238, 238, 0.8);width:'+(w-18)+'px;position:fixed;z-index:3;margin-bottom:5px;line-height: 22px;"><label style="margin-left:6px;font-size:18px;">景点门票信息</label></div>';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top: '+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:6px;margin-top:25px;"><div style="margin-left:6px;">';

  		for(var i=1;i<=5;i++)
  		{
  			info_html +='<div><span>'+i+'、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian'+i+'_base" value="'+(json['jingdian'+i+'_base'] ? json['jingdian'+i+'_base'].replace(/"/g,'&quot;') : "")+'" /></span></div>';
  			info_html +='<div>活动时间：<div style="margin-left:8px;">';
  			info_html +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian'+i+'_xq_hdsj_start" value="'+(json['jingdian'+i+'_xq_hdsj_start'] ? json['jingdian'+i+'_xq_hdsj_start'] : "")+'" /></div>';
  			info_html +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian'+i+'_xq_hdsj_end" value="'+(json['jingdian'+i+'_xq_hdsj_end'] ? json['jingdian'+i+'_xq_hdsj_end'] : "")+'" /></div></div></div>';
  			info_html +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian'+i+'_xq_zwfksj" value="'+(json['jingdian'+i+'_xq_zwfksj'] ? json['jingdian'+i+'_xq_zwfksj'] : "")+'" /></div>';
  			info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian'+i+'_xq_price" value="'+(json['jingdian'+i+'_xq_price'] ? json['jingdian'+i+'_xq_price'].replace(/"/g,'&quot;') : "")+'" />';
  			var r = '';
  			if(json['jingdian'+i+'_xq_price'])
  			{
  				var expression = getExpression(json['jingdian'+i+'_xq_price']);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			info_html +='<span style="width:15%">='+r+'</span></div>';
  			info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian'+i+'_xq_ydh" value="'+(json['jingdian'+i+'_xq_ydh'] ? json['jingdian'+i+'_xq_ydh'].replace(/"/g,'&quot;') : "")+'" /></div>';
  			info_html +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian'+i+'_xq_jsqk" value="'+(json['jingdian'+i+'_xq_jsqk'] ? json['jingdian'+i+'_xq_jsqk'].replace(/"/g,'&quot;') : "")+'" /></div>';
  			info_html +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian'+i+'_xq_other">'+(json['jingdian'+i+'_xq_other'] ? json['jingdian'+i+'_xq_other'] : "")+'</textarea></div>';
  		}
  		info_html +='</div></div>';

  		//info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="text-align: center;height:26px;"></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  		for(var i=1;i<=5;i++)
  		{
  			$($(div).find('.jingdian'+i+'_xq_zwfksj')[0]).datepicker();
  		}
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.jingdian1_base')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showJingDianDiv = showJingDianDiv;
  function showArrive(e){
  	var leave = $(e).next();
  	hb_arrive = true;
  	$(leave).removeAttr('disabled');
  	$(e).attr('disabled','disabled');
  	var div = $(e).parent().parent().parent();
  	$(div).find('.hb_arrive_div').each(function(){$(this).show()});
  	$(div).find('.hb_leave_div').each(function(){$(this).hide()});
  	$(div).scrollTop(0);
  	$($(div).find('.hb_arrive1_base_hbh')[0]).focus();
  }
  window.showArrive = showArrive;
  function showLeave(e){
  	var arrive = $(e).prev();
  	hb_arrive = false;
  	//console.log(arrive);
  	$(arrive).removeAttr('disabled');
  	$(e).attr('disabled','disabled');
  	var div = $(e).parent().parent().parent();
  	$(div).find('.hb_arrive_div').each(function(){$(this).hide()});
  	$(div).find('.hb_leave_div').each(function(){$(this).show()});
  	$(div).scrollTop(0);
  	$($(div).find('.hb_leave1_base_hbh')[0]).focus();
  }
  window.showLeave = showLeave;
  function showAirPortDiv(e)//抵达／离开时间
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tablehotel").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var day = $(e).attr("data-day");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext.days && r.ext.days[day] && r.ext.days[day][className])
  	{
  		json = r.ext.days[day][className];
  	}
  	var div = $(".tableairport");
  	var divTop = $('#'+id).scrollTop();
  	//console.log(divTop);
  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.hb_fixed');
  	  	$(div).find('.hb_fixed').remove();
  	  	var bottom_fixed = $(div).find('.showdiv_fixed');
  	  	var next = $(bottom_fixed).next();
  	  	$(div).find('.showdiv_fixed').remove();
  	  	if(json.hb_arrive1_base_hbh|| json.hb_arrive2_base_hbh|| json.hb_arrive3_base_hbh|| json.hb_arrive4_base_hbh|| json.hb_arrive5_base_hbh
  	  		|| json.hb_leave1_base_hbh|| json.hb_leave2_base_hbh|| json.hb_leave3_base_hbh|| json.hb_leave4_base_hbh|| json.hb_leave5_base_hbh)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0)
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else $("."+key).val('');
  	  			if(key.indexOf('_price')>0)
  	  			{
  	  				var input = $(div).find("."+key).get(0);
  	  				if(input)
  	  				{
  	  					computeJingDianAndAirPortResult($(input));
  	  				}
  	  				//computeJingDianAndAirPortResult($("."+key));
  	  			}
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			if($(this).attr('class').indexOf('_price')>0)
  	  			{
  	  				computeJingDianAndAirPortResult($(this));
  	  			}
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	  	$($(div).find('.hb_arrive_div')[0]).before(fixed);
  	  	$(next).before(bottom_fixed);
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tableairport");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow-y':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div class="hb_fixed" style="background-color:rgba(238, 238, 238, 0.8);width:'+(w-18)+'px;position:fixed;z-index:3;margin-bottom:5px;line-height:19px;"><div style="font-size:15px;line-height:normal;font-weight:bold;margin-top:5px;"><button disabled="disabled" class="hb_btn_arrive" onclick="window.showArrive(this)" style="margin-left:8px;cursor:pointer;">抵达</button><button class="hb_btn_leave" onclick="window.showLeave(this)" style="margin-left:30px;cursor:pointer;">离开</button></div>';
  		info_html += '<label style="margin-left:10px;font-size:18px;" class="hb_arrive_div">抵达航班(车次)信息</label><label style="margin-left:10px;font-size:18px;display:none;" class="hb_leave_div">离开航班(车次)信息</label></div>';
  		info_html += '<div class="showdiv_fixed" style=" text-align:center;position: fixed;height:25px;background-color: rgba(238, 238, 238, 0.9);width: '+(w-10)+'px;z-index:5;margin-top: '+(h-26)+'px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="margin-left:10px;margin-top:56px;" class="hb_arrive_div"><div style="margin-left:6px;">';
  		for(var i=1;i<=5;i++)
  		{
  			info_html += '<div>'+i+'、航班(车次)号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达航班(车次)号" class="hb_arrive'+i+'_base_hbh" value="'+(json['hb_arrive'+i+'_base_hbh'] ? json['hb_arrive'+i+'_base_hbh'].replace(/"/g,'&quot;') : "")+'" /></div>';
  			info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_arrive'+i+'_base_date" value="'+(json['hb_arrive'+i+'_base_date'] ? json['hb_arrive'+i+'_base_date'] : "")+'" /></div>';
  			info_html += '<div>两端机场(车站)代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场(车站)代码缩写" class="hb_arrive'+i+'_base_code" value="'+(json['hb_arrive'+i+'_base_code'] ? json['hb_arrive'+i+'_base_code'] : "")+'" /></div>';
  			info_html += '<div>起飞(开车)时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞(开车)时间" class="hb_arrive'+i+'_base_qfsj" value="'+(json['hb_arrive'+i+'_base_qfsj'] ? json['hb_arrive'+i+'_base_qfsj'] : "")+'" /></div>';
  			info_html += '<div>抵达(到站)时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达(到站)时间" class="hb_arrive'+i+'_base_ddsj" value="'+(json['hb_arrive'+i+'_base_ddsj'] ? json['hb_arrive'+i+'_base_ddsj'] : "")+'" /></div>';
  			info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_arrive'+i+'_info_price" value="'+(json['hb_arrive'+i+'_info_price'] ? json['hb_arrive'+i+'_info_price'].replace(/"/g,'&quot;') : "")+'" />';
  			var r = '';
  			if(json['hb_arrive'+i+'_info_price'])
  			{
  				var expression = getExpression(json['hb_arrive'+i+'_info_price']);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			info_html +='<span style="width:15%">='+r+'</span></div>';
  			info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_arrive'+i+'_info_ydh" value="'+(json['hb_arrive'+i+'_info_ydh'] ? json['hb_arrive'+i+'_info_ydh'].replace(/"/g,'&quot;') : "")+'" /></div>';
  			info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_arrive'+i+'_info_jsqk">'+(json['hb_arrive'+i+'_info_jsqk'] ? json['hb_arrive'+i+'_info_jsqk'] : "")+'</textarea></div>';
  		}
  		info_html += '</div></div>';

  		//info_html += '<div style="font-size:20px;font-weight:bold;">离开：</div>';
  		info_html += '<div style="margin-left:10px;display:none;margin-top:56px;" class="hb_leave_div"><div style="margin-left:6px;">';
  		for(var i=1;i<=5;i++)
  		{
  			info_html += '<div>'+i+'、航班(车次)号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="离开航班(车次)号" class="hb_leave'+i+'_base_hbh" value="'+(json['hb_leave'+i+'_base_hbh'] ? json['hb_leave'+i+'_base_hbh'].replace(/"/g,'&quot;') : "")+'" /></div>';
  			info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_leave'+i+'_base_date" value="'+(json['hb_leave'+i+'_base_date'] ? json['hb_leave'+i+'_base_date'] : "")+'" /></div>';
  			info_html += '<div>两端机场(车站)代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场(车站)代码缩写" class="hb_leave'+i+'_base_code" value="'+(json['hb_leave'+i+'_base_code'] ? json['hb_leave'+i+'_base_code'] : "")+'" /></div>';
  			info_html += '<div>起飞(开车)时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞(开车)时间" class="hb_leave'+i+'_base_qfsj" value="'+(json['hb_leave'+i+'_base_qfsj'] ? json['hb_leave'+i+'_base_qfsj'] : "")+'" /></div>';
  			info_html += '<div>抵达(到站)时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达(到站)时间" class="hb_leave'+i+'_base_ddsj" value="'+(json['hb_leave'+i+'_base_ddsj'] ? json['hb_leave'+i+'_base_ddsj'] : "")+'" /></div>';
	  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_leave'+i+'_info_price" value="'+(json['hb_leave'+i+'_info_price'] ? json['hb_leave'+i+'_info_price'].replace(/"/g,'&quot;') : "")+'" />';
  			r = '';
  			if(json['hb_leave'+i+'_info_price'])
  			{
  				var expression = getExpression(json['hb_leave'+i+'_info_price']);
  				r = eval(expression);
  				if(isNaN(r))
  				{
  					r = '';
  				}
  			}
  			info_html +='<span style="width:15%">='+r+'</span></div>';
  			info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_leave'+i+'_info_ydh" value="'+(json['hb_leave'+i+'_info_ydh'] ? json['hb_leave'+i+'_info_ydh'].replace(/"/g,'&quot;') : "")+'" /></div>';
  			info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_leave'+i+'_info_jsqk">'+(json['hb_leave'+i+'_info_jsqk'] ? json['hb_leave'+i+'_info_jsqk'] : "")+'</textarea></div>';
  		}
  		info_html += '</div></div>';

  		//info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		info_html += '<div style="text-align: center;height:26px;"></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  		for(var i=1;i<=5;i++)
  		{
  			$($(div).find('.hb_arrive'+i+'_base_date')[0]).datepicker();
  			$($(div).find('.hb_leave'+i+'_base_date')[0]).datepicker();
  		}
  	}
  	$(div).scrollTop(0);
  	var arrive_index = 0;
  	for(var i=1;i<=5;i++)
  	{
  		if(!json['hb_arrive'+i+'_base_hbh']) arrive_index += 1;
  	}
  	var leave_index = 0;
  	for(var i=1;i<=5;i++)
  	{
  		if(!json['hb_leave'+i+'_base_hbh']) leave_index += 1;
  	}
  	//console.log('arrive_index='+arrive_index+',leave_index='+leave_index);
  	if(arrive_index == 5 && leave_index < 5)
  	{
  		var leave_btn = $(div).find('.hb_btn_leave').get(0);
  		if(leave_btn)
  		{
  			showLeave($(leave_btn));
  		}
  	}
  	else
  	{
  		var arrive_btn = $(div).find('.hb_btn_arrive').get(0);
  		if(arrive_btn)
  		{
  			showArrive($(arrive_btn));
  		}
  	}
  	if(!hb_arrive)
  	{
  		$($(div).find('.hb_leave1_base_hbh')[0]).focus();
  	}
  	else
  	{
  		$($(div).find('.hb_arrive1_base_hbh')[0]).focus();
  	}
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showAirPortDiv = showAirPortDiv;
  function submitLineInfo(e)
  {
   	var div = $(e).parent().parent();
  	var rid = $(div).attr("id");
  	//var day = $(div).attr("data-day");
  	//var inputs = $(div).find("input");
  	var textareas = $(div).find("textarea").get(0);
  	var className = $(show).attr("class");
  	//console.log($(textareas).val());
  	//console.log(JSON.stringify($(textareas).val()));
  	var msg = ':=[{"$set": {"ext.'+className+'":'+JSON.stringify($(textareas).val())+'}}]';
  	sendMessage(rid,msg);
  }
  window.submitLineInfo = submitLineInfo;
  function showLineTextAreaDiv(e)//Line多行文本
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tablesimple").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tabledinner").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	var rid = $(e).attr("id");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext)
  	{
  		json = r.ext;
  	}
  	var div = $(".lineTextAreaDiv");
  	var name = '费用包含';
  	var name_info = '费用包含';
  	if(className == "line_fee_nin") name = "费用不包含",name_info = "费用不包含";
  	else if(className == "line_note") name = "注意事项",name_info = "注意事项";
  	else if(className == "line_fjxy") name = "附加协议",name_info = "附加协议";

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	if(json[className]&&json[className].length>0)
  	  	{
  	  		$($(div).find(".textarea_base")[0]).val(json[className]);
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  			$(this).attr('placeholder',name_info);
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  			$(this).attr('placeholder',name_info);
  	  		});
  	  	}
  	  	$($(div).find(".class_name")[0]).text(name+'：');
  	  	$(div).show();
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","lineTextAreaDiv");
  		$(div).attr("id",$(e).attr("id"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;"><div><span><span class="class_name">'+name+'：</span><textarea style="margin-left:10px;width:95%;height:'+((h-60)>150 ?(h-60):150)+'px;" placeholder="'+name_info+'" class="textarea_base">'+(json[className] ? json[className] : "")+'</textarea></span></div>';
  		info_html += '</div>';
  		info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitLineInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$($(div).find('.textarea_base')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showLineTextAreaDiv = showLineTextAreaDiv;
  function submitLineGYSInfo(e)
  {
   	var div = $(e).parent().parent();
  	var rid = $(div).attr("id");
  	//var day = $(div).attr("data-day");
  	//var inputs = $(div).find("input");
  	var inputs = $(div).find("input");
  	var json = {};
  	for(var i=0;i<inputs.length;i++)
  	{
  		json[$(inputs[i]).attr('class')] = $(inputs[i]).val();
  	}
  	var className = $(show).attr("class");
  	//console.log($(textareas).val());
  	//console.log(JSON.stringify($(textareas).val()));
  	var msg = ':=[{"$set": {"ext.'+className+'":'+JSON.stringify(json)+'}}]';
  	sendMessage(rid,msg);
  }
  window.submitLineGYSInfo = submitLineGYSInfo;
  function showLineGYSDiv(e)//LineGYSDiv
  {
  	clickShow = true;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(show) $(show).css('background','white');
  	$(".mouse_show_div").remove();
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tablesimple").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tabledinner").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".lineTextAreaDiv").hide();
  	var rid = $(e).attr("id");
  	var className = $(e).attr("class");
  	//var value = $(e).val();
  	var r = findRoomByRid(rid);
  	var json = {};
  	if(r && r.ext && r.ext[className])
  	{
  		json = r.ext[className];
  	}
  	var div = $(".lineGYSDiv");
  	var name = '供应商信息';
  	var name_info = '费用包含';
  	//if(className == "line_fee_nin") name = "费用不包含",name_info = name;
  	//else if(className == "line_note") name = "注意事项",name_info = name;
  	//else if(className == "line_fjxy") name = "附加协议",name_info = name;

  	var top = $(e).position().top+$(e).height()+23;
  	if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	var left = $(e).position().left;
  	var w = Math.max(324,width/5);
  	var h = height/4;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height)
  	{
  		top = $(e).position().top - h+20;
  		if(isTitle && $('#'+id).scrollTop()>10) top = top + $('#'+id).scrollTop()/2-10;
  	}
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	if(json.gys_name || json.gys_dj)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			$($(div).find('.'+key).get(0)).val(json[key]);
  	  		}
  	  	}
  	  	else
  	  	{
  	  		$(div).find('input').each(function(){
  	  			$(this).val('');
  	  		});
  	  		$(div).find('textarea').each(function(){
  	  			$(this).val('');
  	  		});
  	  	}
  	  	$(div).show();
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","lineGYSDiv");
  		$(div).attr("id",$(e).attr("id"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow-y':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;">';
  		info_html += '<div><span>供应商名称：<input style="margin-left:10px;width:95%;" placeholder="供应商名称" class="gys_name" value="'+(json.gys_name ? json.gys_name.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>地接社名称：<input style="margin-left:10px;width:95%;" placeholder="地接社名称" class="gys_dj" value="'+(json.gys_dj ? json.gys_dj.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>负责人：<input style="margin-left:10px;width:95%;" placeholder="负责人" class="gys_fuzeren" value="'+(json.gys_fuzeren ? json.gys_fuzeren.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>联系电话：<input style="margin-left:10px;width:95%;" placeholder="联系电话" class="gys_phone" value="'+(json.gys_phone ? json.gys_phone.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '</div>';
  		info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitLineGYSInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$($(div).find('.name')[0]).focus();
  	$(e).css('background-color','yellow');
  	show = e;
  	currentShowDiv = div;
  }
  window.showLineGYSDiv = showLineGYSDiv;
  function mouseOverShow(e)
  {
  	if(clickShow) return;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	timeOutShow = setTimeout(function()
  	{
  		mouseOverShowDiv(e);
  		clickShow = false;
  	},500);
  }
  window.mouseOverShow = mouseOverShow;
  function mouseOutHide(e)
  {
  	$(".mouse_show_div").remove();
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(!clickShow)
  	{
  		daysInputClick(e);
  	}
  }
  window.mouseOutHide = mouseOutHide;
  function trHtml(date,begin,length,rid)
  {
  	//console.log('trHtml');
  	var tr_html = '';
  	var startDate = date;
  	for(var i=begin;i<=length;i++)
	{
		tr_html+='<tr  id="'+rid+'" class="day" data-days="'+(i+1)+'">';
		var w = startDate.getDay();
		var month = startDate.getMonth()+1;
		if(month>12) month = 1;
		if(w == 0 || w==5 || w==6)
		{
			tr_html +='<td><span style="color:red;">';
		}
		else
		{
			tr_html +='<td><span>';
		}
		var day = startDate.getDate();
		if(day<10) day = '0'+day;
		tr_html +=weekDays[w]+'</span></td><td><span style="display:none;">'+month+'/'+day+'/'+startDate.getFullYear()+'</span><span>'+month+'/'+day+'</span></td>'
		for(var j=0;j<14;j++)
		{
			if(j==0)
			{
				//if(i==0)
				//	tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.daysInputClick(this)" onchange="window.daysInputChange(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
				//else
					tr_html+='<td style="width:140px;"><input class="'+dayClassName[j]+'" onclick="window.showDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'"/></td>';
			}
			else if(j==2)
				tr_html+='<td style="width:210px;"><input class="'+dayClassName[j]+'" onclick="window.showHotelDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==3 || j==7)
			{
				tr_html+='<td';
				if(j==7) tr_html+=' style="width:120px;">';
				else if(j==3) tr_html+=' style="width:120px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showTextAreaDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==8)
				tr_html+='<td style="min-width:20px;max-width:130px;width:150px;"><input class="'+dayClassName[j]+'" onclick="window.showBusDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==6)
			{
				tr_html+='<td';
				if(j==6) tr_html+=' style="width:60px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showHotelOtherDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==1 || j==9)
			{
				tr_html+='<td';
				if(j==7) tr_html+=' style="width:110px;">';
				else if(j==9) tr_html+=' style="width:80px;">';//else if(j==10) tr_html+=' style="max-width:70px;">';
				else if(j==6) tr_html+=' style="width:60px;">';
				else if(j==1) tr_html+=' style="width:186px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showSimpleDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==11)
				tr_html+='<td style="width:110px"><input class="'+dayClassName[j]+'" onclick="window.showDinnerDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==12)
				tr_html+='<td class="jingdian_td" style="width:70px;"><input class="'+dayClassName[j]+'" onclick="window.showJingDianDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==13)
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showAirPortDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else
			{
				if(j==10) continue;
				tr_html+='<td style="width:';
				if(j==1) tr_html+='60px;">';
				else tr_html+='36px;">';
				tr_html +='<input class="'+dayClassName[j]+'" onclick="window.daysInputClick(this)" onchange="window.daysInputChange(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
		}
		tr_html += '</tr>';
		startDate.setDate(startDate.getDate()+1);
	}
  	return tr_html;
  }
  function dateformat(date_string)
  {
  	if(!date_string) return null;
  	var date = date_string.split('/');
  	var month = date[0];
  	if(parseInt(month)<10) month = '0'+month;
  	return date[2]+'-'+month+'-'+date[1];
  }
  function sendHotelMessage(rid,msg)
  {
  	var msgObject = { _id: Random.id(), rid: rid, msg: msg}
  	Meteor.call('sendMessage',msgObject,function(error,result){
  		if(!error)
  		{
  			var msg = result.msg.replace(':=','');
  			var jsonMsg = JSON.parse(msg);
  			if(jsonMsg && jsonMsg instanceof Array && jsonMsg.length>0)
  			{
  				//console.log(jsonMsg);
				var json = jsonMsg[0];
				for(var kpush in json)
				{
					if(kpush.indexOf('$push') == 0)
					{
						var data = json[kpush];
						for(var kdata in data)
						{
							var value = data[kdata];
							//console.log(value);
							var r = findRoomByRid(rid);
							if(r && r.ext)
							{
								var hotels = r.ext.hotels;
								//console.log(hotels);
								if(!hotels) hotels = [];
								hotels.push(value);
								r.ext.hotels = hotels;
								//console.log(r.ext.hotels);
							}
						}
					}
				}
			}
		}
  	});
  }
  function sendMessage(rid,msg)
  {
  	var msgObject = { _id: Random.id(), rid: rid, msg: msg}
  	//console.log(msgObject);
  	Meteor.call('sendMessage',msgObject,function(error,result){
  		//console.log('sendMessage');
  		//console.log(error);
  		//console.log(result);
  		if(!error)
  		{
  			var msg = result.msg.replace(':=','');
  			var jsonMsg = JSON.parse(msg);
  			if(jsonMsg && jsonMsg instanceof Array && jsonMsg.length>0)
  			{
  				//console.log(jsonMsg);
				var json = jsonMsg[0];
				for(var kset in json)
				{
					var data = json[kset];
					for(var kdata in data)
					{
						//var keys = kdata.split('.');
						var value = data[kdata];
						//console.log(value);
						if(value instanceof Object)
						{
							var showValue = '';
							for(var vk in value)
							{
								if(vk.indexOf('base')>0)
								{
									if(value[vk].length>0)
									{
										var vbase = value[vk];
										if(vk == 'breakfast_base')
										{
											vbase = "B"+vbase;
										}
										else if (vk == 'lunch_base')
										{
											vbase = "L"+vbase
										}
										else if(vk == 'dinner_base')
										{
											vbase = "D"+vbase;
										}
										else if(vk.indexOf('hb_arrive')>-1)
										{
											if(showValue.length == 0 )//|| showValue.indexOf('抵达') == -1)
											{
												vbase = ""+vbase;//抵达：
											}
											else
											{
												if(vk.indexOf('base_hbh') > -1) vbase = '、'+vbase;
												if(vk.indexOf('_ddsj')>0) vbase = '/'+vbase;
												else vbase = ' '+vbase;
											}
										}
										else if(vk.indexOf('hb_leave')>-1)
										{
											if(showValue.length == 0 )//|| showValue.indexOf('离开') == -1)
											{
												vbase = ""+vbase;//离开：
											}
											else
											{
												if(vk.indexOf('base_hbh') > -1) vbase = '、'+vbase;
												if(vk.indexOf('_ddsj')>0) vbase = '/'+vbase;
												else vbase = ' '+vbase;
											}
										}
										if(showValue.length == 0) showValue = vbase;
										else
										{
											if(vk.indexOf('hb_') == 0)
											{
												if(vk.indexOf('_base_date')>0) continue;
												showValue += vbase;
											}
											else if(vk.indexOf('_city') > 0)
											{
												showValue = vbase + ' ' + showValue;
											}
											else
											{
												if(vk.indexOf('hotel_base') == 0)
												{
													showValue += ''+vbase;
												}
												else if(vk.indexOf('other_base') == 0)
												{
													if(vk.indexOf('_shuoming')>0)
													{
														if(vbase.length>0) showValue = vbase;
													}
												}
												else
												{
													showValue += '、'+vbase;
												}
											}
										}
									}
								}
							}
							if(kdata.indexOf('days') >0)
							{
								if(show)
								{
									//luwei should display empty string:if(showValue.length>0)
									{
										$(show).val(showValue);
									}
									var rid = $(show).attr("id").replace('end-date','');
  									var day = $(show).attr("data-day");
  									var className = $(show).attr("class");
  									var r = findRoomByRid(rid);
  									//console.log(r.ext.days);
  									if(r && r.ext)
  									{
  										//console.log(r);
  										jsValue = {};
  										if(day&&r.ext.days)
  										{
  											//console.log('prev');
  											//console.log(r.ext.days);
  											if(r.ext.days[day])
  												jsValue = r.ext.days[day];
  											//else jsValue[day] = {};
  											//console.log(jsValue);
  											//console.log(value);
  											jsValue[className] = value;
  											//console.log(jsValue);
  											r.ext.days[day] = jsValue;
  											//console.log(r);
  											//console.log('prev');
  											//console.log(r.ext.days);
  										}
  										else
  										{
  											r.ext['days'] = jsValue;
  										}
  									}
  								}
							}
							else
							{
								if(show)
								{
									var rid = $(show).attr("id").replace('end-date','');
  									var day = $(show).attr("data-day");
  									var className = kdata.split('.').pop();//$(show).attr("class");
  									var r = findRoomByRid(rid);
  									if(r && r.ext)
  									{
  										jsValue = {};
  										if(day)
  										{
  											if(r.ext.days[day])
  												jsValue = r.ext.days[day];
  											jsValue[className] = value;
  											r.ext.days[day] = jsValue;
  											//r.ext.days[day][className] = value;
  										}
  										else
  										{
  											r.ext[className] = value;
  											if(className.indexOf('line')==0&&className.indexOf('price')<0)
  											{
  												if(className.indexOf('line_gys')==0)
  												{
  													$(show).val(value.gys_name?value.gys_name:'');
  												}
  											}
  										}
  									}
  								}
							}
						}
						else
						{
							if(kdata.indexOf('days') >0)
							{
								if(show)
								{
									var rid = $(show).attr("id").replace('end-date','');
  									var day = $(show).attr("data-day");
  									var className = kdata.split('.').pop();//$(show).attr("class");
  									var r = findRoomByRid(rid);
  									if(r && r.ext)
  									{
  										jsValue = {};
  										if(day&&r.ext.days)
  										{
  											//console.log('prev');
  											//console.log(r.ext.days);
  											if(r.ext.days[day])
  												jsValue = r.ext.days[day];
  											//else jsValue[day] = {};
  											jsValue[className] = value;
  											r.ext.days[day] = jsValue;
  											//r.ext.days[day][className] = value;
  											//console.log('after');
  											//console.log(r.ext.days);
  										}
  										else
  										{
  											//r.ext.days = jsValue;
  										}
  									}
  								}
							}
							else
							{
								if(show)
								{
									var rid = $(show).attr("id").replace('end-date','');
  									var day = $(show).attr("data-day");
  									var className = kdata.split('.').pop();//$(show).attr("class");
  									var r = findRoomByRid(rid);
  									if(r && r.ext)
  									{
  										jsValue = {};
  										if(day)
  										{
  											if(r.ext.days[day])
  												jsValue = r.ext.days[day];
  											jsValue[className] = value;
  											r.ext.days[day] = jsValue;
  											//r.ext.days[day][className] = value;
  										}
  										else
  										{
  											r.ext[className] = value;
  											if(className.indexOf('line')==0&&className.indexOf('price')<0)
  											{
  												var v = value.length>30?value.substring(0,30):value;
  												$(show).val(v);
  											}
  										}
  									}
  								}
							}
						}
					}
				}
  			}
  		}
  	});
  }
  function inputChange(t,rid)
  {
  	//console.log(t)rocketchat_room-ext-flextab.js:5388:13
  	var value = $(t).val();
  	if((value && value.length>0)||(value!=undefined&&value.length==0&&($(t).attr("class")=="line_gys_price" || $(t).attr("class")=="line_traveler_price")))
  	{
  		var msg = ':=[{"$set": {"ext.'+$(t).attr("class")+'":"'+value+'"}}]';
  		show = t;
  		sendMessage(rid,msg);
  		if($(t).attr("class") == "line_total_price" || $(t).attr("class") == "add_price")
  		{
  			var fee = '';
  			var price = '';
  			if($(t).attr("class") == "add_price")
  			{
  				fee = $(t).val();
  				price = $($(t).parent().prev().find(".line_total_price").get(0)).val();
  			}
  			else
  			{
  				fee = $($(t).parent().next().find(".add_price").get(0)).val();
  				price = $(t).val();
  			}
  			var tr = $(t).parent().parent().parent();
  			var trs = $(tr).nextAll("tr#"+rid);
  			if(trs.length == 0 || price.length==0) return;
  			total_tr = $(trs[trs.length-1]).next().next();
  			var span = $($(total_tr).find(".summary_total").get(0)).text();
  			if(span)
  			{
  				var total_num = span.substring(span.indexOf("=")+1);
  				var profit = $(total_tr).next().find(".summary_profit").get(0);
  				if(profit)
  				{
  					price = getNumber(price);
  					if(fee.length>0)
  					{
  						fee = getNumber(fee);
  						$(profit).text(price+'-'+fee+'-'+total_num+'='+eval(price+'-'+fee+'-'+total_num));
  					}
  					else
  					{
  						$(profit).text(price+'-'+total_num+'='+eval(price+'-'+total_num));
  					}
  				}
  			}
  		}
  		else if($(t).attr("class") == "line_gys_price" || $(t).attr("class") == "line_traveler_price")
  		{
  			var fee = '';
  			var price = '';
  			if($(t).attr("class") == "line_traveler_price")
  			{
 				fee = $(t).val();
 				price = $($(t).parent().prev().find(".line_gys_price").get(0)).val();
  			}
  			else
  			{
  				fee = $($(t).parent().next().find(".line_traveler_price").get(0)).val();
  				price = $(t).val();
  			}
  			var tr = $(t).parent().parent().parent();
  			var trs = $(tr).nextAll("tr#"+rid);
  			if(trs.length == 0) return;
  			total_tr = $(trs[trs.length-1]).next().next();
  			var span = $($(total_tr).find(".summary_total").get(0)).text();
  			if(span)
  			{
  				var total_num = span.substring(span.indexOf("=")+1);
  				var profit = $(total_tr).next().find(".summary_profit").get(0);
  				if(profit)
  				{
  					if(fee.length>0 || price.length>0)
  					{
  						if(!fee) fee = 0;
  						if(!price) price = 0;
  						fee = getNumber(fee);
  						price = getNumber(price);
  						console.log(fee);
  						console.log(price);
  						$(profit).text(fee+'-'+price+'='+eval(fee+'-'+price));
  					}
  					else
  					{
  						fee = $($(t).parent().parent().parent().prev().find(".add_price").get(0)).val();
  						price = $($(t).parent().parent().parent().prev().find(".line_total_price").get(0)).val();
  						if(price.length==0) return;
  						price = getNumber(price);
  						if(fee.length>0)
  						{
  							fee = getNumber(fee);
  							$(profit).text(price+'-'+fee+'-'+total_num+'='+eval(price+'-'+fee+'-'+total_num));
  						}
  						else
  						{
  							$(profit).text(price+'-'+total_num+'='+eval(price+'-'+total_num));
  						}
  					}
  				}
	  		}
  		}
  	}
  }
  window.inputChange = inputChange;
  function findRoomByRid(rid)
  {
  	for(var index in rooms)
  	{
  		var r = rooms[index];
  		if(r._id == rid)
  		{
  			return r;
  		}
  	}
  	return null;
  }
  function sendChangeDateMessage()
  {
  	if(msgQueue.length>0)
  	{
  		var jData = msgQueue.shift();
  		sendMessage(jData.rid,jData.msg);
  		setTimeout(function(){sendChangeDateMessage();},1500);
  	}
  }
  function dateChange(t,rid)
  {
  	var endValue = $(t).val();
  	var startId = $(t).attr('id').replace('end','start');
  	var startValue = $("#"+startId).val();
  	if(startValue && startValue.length>0)
  	{
  		var startDate = new Date(startValue);
  		var endDate = new Date(endValue);
  		var time = endDate.getTime() - startDate.getTime();
  		//console.log(time/1000/3600/24);
  		var tr = $(t).parent().parent().parent();
  		var trs = $(tr).nextAll("tr#"+rid);
  		if( time<= 0)
  		{
  			alert('结束日期要大于开始日期');
  			if(trs && trs.length>0)
  			{
  				//console.log($($(trs[0]).children('td')[1]).find('span').get(0));
  				//console.log($($(trs[trs.length-1]).children('td')[1]).find('span').get(0));
  				var first = new Date(dateformat($($($(trs[0]).children('td')[1]).find('span').get(0)).text()));
  				var end = new Date(dateformat($($($(trs[trs.length-1]).children('td')[1]).find('span').get(0)).text()));
  				$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  				$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  			}
  			else
  			{
  				$(t).val('');
  			}
  		}
  		else
  		{
  			var st = $("#"+startId);
  			var msg = ':=[{"$set":{"ext.'+$(st).attr('class').replace(' hasDatepicker','')+'":"'+startValue+'","ext.'+$(t).attr('class').replace(' hasDatepicker','')+'":"'+endValue;
  			var length = time/1000/3600/24;
  			if(trs && trs.length>0)
  			{
  				var first = new Date(dateformat($($($(trs[0]).children('td')[1]).find('span').get(0)).text()));
  				var end = new Date(dateformat($($($(trs[trs.length-1]).children('td')[1]).find('span').get(0)).text()));
  				if(confirm('确定要修改日期？'))
  				{
  					msg +='"}}]';
  					sendMessage(rid,msg);
  					var daysOrigin = {};
  					var r = findRoomByRid(rid);
  					if(r && r.ext && r.ext.days)
  					{
  						daysOrigin = r.ext.days;
  					}
  					for(var i=0;i<=length;i++)
  					{
  						if(i<trs.length)
  						{
  							var td = $(trs[i]).children('td');
  							var td_week = '';
  							var w = startDate.getDay();
							var month = startDate.getMonth()+1;
							if(w == 0 || w==5 || w==6)
							{
								td_week +='<span style="color:red;">';
							}
							else
							{
								td_week +='<span>';
							}
							td_week +=weekDays[w]+'</span>';
							$(td[0]).html(td_week);

							var day = startDate.getDate();
							if(day<10) day = '0'+day;
							var dateString = month+'/'+day+'/'+startDate.getFullYear();
							$(td[1]).html('<span style="display:none;">'+dateString+'</span><span>'+month+'/'+day+'</span>');
							var day_info = daysOrigin[i+1];
							var is_send = true;
							if(day_info && day_info.week && day_info.date)
							{
								if(day_info.week == weekDays[w] && day_info.date == dateString)
								{
									is_send = false;
								}
							}
							if(is_send)
							{
								msg = ':=[{"$set": {"ext.days.'+(i+1)+'.week":"'+weekDays[w]+'","ext.days.'+(i+1)+'.date":"'+dateString+'"}}]';
								//sendMessage(rid,msg);
								msgQueue.push({'rid':rid,'msg':msg});
							}
							startDate.setDate(startDate.getDate()+1);
  						}
  						else
  						{
  							break;
  						}
  					}
  					if(length >= trs.length)
  					{

  						var tr_html = trHtml(startDate,trs.length,length,rid);
  						$(trs[trs.length-1]).after(tr_html);
  					}
  					else
  					{
  						var j = length+1;
  						for(var i=j;i<trs.length;i++)
  						{
  							$(trs[i]).remove();
  						}
  					}
  					if(msgQueue.length > 0) sendChangeDateMessage();
  				}
  				else
  				{
  					$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  					$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  				}
  				/*if(endDate.getTime() - first.getTime() <= 0)
  				{
  					if(confirm('你所选择的结束日期在表中的最小日期之前，这样会造成之前的所有数据被清除！'))
  					{
  						//l = trs.length;
  						//if(l
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()>endDate.getTime())
  							{
  								msg = ':=[{"$set": {"ext.days.'+(i+1)+'.week":"'+week+'","ext.days.'+(i+1)+'.date":"'+date+'"}}]';
  								$(trs[i]).remove();
  							}
  						}
  						isEqual = endDate.getTime() - first.getTime();
  						if(isEqual == 0) length -= 1;
  						var tr_html = trHtml(startDate,0,length,rid);
  						if(isEqual == 0) $(tr).next().before(tr_html);
  						else $(tr).after(tr_html);

  						trs = $(tr).nextAll("tr#"+rid);
  						for(var i=0;i<trs.length;i++)
  						{
  							$(trs[i]).find("input").each(function(e){
  								$(this).attr("data-day",i+1);
  							});
  						}
  					}
  					else
  					{
  						$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() - end.getTime() >= 0)
  				{
  					if(confirm('你所选择的开始日期在表中的最大日期之后，这样会造成之前的所有数据被清除！'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()<startDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						isEqual = startDate.getTime() - end.getTime();
  						if(isEqual == 0) startDate.setDate(startDate.getDate()+1);
  						var tr_html = trHtml(startDate,0,length,rid);
  						if(isEqual == 0) $(tr).next().after(tr_html);
  						else $(tr).after(tr_html);

  						trs = $(tr).nextAll("tr#"+rid);
  						for(var i=0;i<trs.length;i++)
  						{
  							$(trs[i]).find("input").each(function(e){
  								$(this).attr("data-day",i+1);
  							});
  						}
  					}
  					else
  					{
  						$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() > first.getTime() && endDate.getTime() < end.getTime())
  				{
  					if(confirm('你所选择的日期在表中的日期的中间，这样会造成表中上下两端的有些数据被清除！'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()<startDate.getTime() || t.getTime()>endDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						trs = $(tr).nextAll("tr#"+rid);
  						for(var i=0;i<trs.length;i++)
  						{
  							$(trs[i]).find("input").each(function(e){
  								$(this).attr("data-day",i+1);
  							});
  						}
  					}
  					else
  					{
  						$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() <= first.getTime() && endDate.getTime() <= end.getTime())
  				{
  					if(confirm('你所选择的日期会把表中的下端有些数据被清除！上端有可能添加行'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()>endDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						l = (first.getTime() - startDate.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							var h = trHtml(startDate,0,l,rid)
  							$(trs[0]).before(h);
  						}
  						trs = $(tr).nextAll("tr#"+rid);
  						for(var i=0;i<trs.length;i++)
  						{
  							$(trs[i]).find("input").each(function(e){
  								$(this).attr("data-day",i+1);
  							});
  						}
  					}
  					else
  					{
  						$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() >= first.getTime() && endDate.getTime() >= end.getTime())
  				{
  					if(confirm('你所选择的日期会把表中的上端有些数据被清除！下端有可能添加行'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()<startDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						l = (endDate.getTime() - end.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							end.setDate(end.getDate()+1)
  							var h = trHtml(end,0,l,rid)
  							$(trs[trs.length-1]).after(h);
  						}
  						trs = $(tr).nextAll("tr#"+rid);
  						for(var i=0;i<trs.length;i++)
  						{
  							$(trs[i]).find("input").each(function(e){
  								$(this).attr("data-day",i+1);
  							});
  						}
  					}
  					else
  					{
  						$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() < first.getTime() && endDate.getTime() > end.getTime())
  				{
  					if(confirm('你所选择的日期会在表中的上下两端添加行'))
  					{
  						l = (first.getTime() - startDate.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							var h = trHtml(startDate,0,l-1,rid)
  							$(trs[0]).before(h);
  						}
  						l = (endDate.getTime() - end.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							end.setDate(end.getDate()+1)
  							var h = trHtml(end,0,l-1,rid)
  							$(trs[trs.length-1]).after(h);
  						}
  						trs = $(tr).nextAll("tr#"+rid);
  						for(var i=0;i<trs.length;i++)
  						{
  							$(trs[i]).find("input").each(function(e){
  								$(this).attr("data-day",i+1);
  							});
  						}
  					}
  					else
  					{
  						$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#"+startId).val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}//*/
  			}
  			else
  			{
  				msg += '","ext.days":{}}}]';
  				show = t;
  				sendMessage(rid,msg);
  				var tr_html = trHtml(startDate,0,length,rid);
  				var r = findRoomByRid(rid);
  				if(r)
  				{
  					var s_html = summaryDataHtml(r);
  					$(tr).after(s_html);
  				}
  				$(tr).after(tr_html);
  				var end = endDate;
				setTimeout(function(){$(t).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()))},800);
  			}
  			//console.log(msg)
  			//console.log(JSON.parse(msg.replace(':=','')));
  		}
  	}
  }
  window.dateChange = dateChange;
  function daysInputClick(t)
  {
  	if(show) $(show).css('background','white');
  	if(clickShow) clickShow = false;
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
  	if(timeOutSearch) clearTimeout(timeOutSearch),timeOutSearch = null;
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tablehotel").hide();
  	$(".tablejingdian").hide();
  	$(".tableairport").hide();
  	$(".tableTextAreaDiv").hide();
  	$(".tablebus").hide();
  	$(".tablehotelother").hide();
  	$('.hotelsearch').remove();
  	$(".lineTextAreaDiv").hide();
  	$(".lineGYSDiv").hide();
  	show = null;
  	currentShowDiv = null;
  }
  window.daysInputClick = daysInputClick;
  function daysInputChange(t)
  {
  	//console.log(t)
  	var rid = $(t).attr("id");
  	var day = $(t).attr("data-day");
  	var className = $(t).attr("class");
  	var value = $(t).val();
  	var r = findRoomByRid(rid);
  	if(value && value.length>0)
  	{
  		var msg = '';
  		if(!r.ext.days || !r.ext.days[day])
  		{
  			var tr = $(t).parent().parent();
  			var span = $(tr).find('span');
  			if(!span || !span.length) return;
  			var week = $(span[0]).text();
  			var date = $(span[1]).text();
  			msg = ':=[{"$set": {"ext.days.'+day+'.week":"'+week+'","ext.days.'+day+'.date":"'+date+'","ext.days.'+day+'.'+className+'":"'+value+'"}}]';
  		}
  		else
  		{
  			msg = ':=[{"$set": {"ext.days.'+day+'.'+className+'":"'+value+'"}}]';
  		}
  		//console.log(JSON.parse(msg.replace(':=','')));
  		//console.log(r.ext.days[day]);
  		show = t;
  		sendMessage(rid,msg);
  	}
  }
  window.daysInputChange = daysInputChange;

  function trHTMLByJSON(json,rid,key)
  {
  	var tr_html = '';
  	var i = key - 1;
  	var startDate = new Date(dateformat(json.date));
  	tr_html+='<tr  id="'+rid+'" class="day" data-days="'+(i+1)+'">';
	var w = startDate.getDay();
	if(w == 0 || w==5 || w==6)
	{
		tr_html +='<td><span style="color:red;">';
	}
	else
	{
		tr_html +='<td><span>';
	}
	var day = startDate.getDate();
	if(day<10) day = '0'+day;
	tr_html += (json.week ? json.week : weekDays[w])+'</span></td><td><span style="display:none;">'+json.date+'</span><span>'+(startDate.getMonth()+1)+'/'+day+'</span></td>'
	for(var j=0;j<14;j++)
	{
			var value = "";
			if(j==0)
			{
				//if(i==0)
				//	tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.daysInputClick(this)" value="'+(json[dayClassName[j]] ? json[dayClassName[j]] : "")+'"  onchange="window.daysInputChange(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
				//else
				{
					if(json[dayClassName[j]] && (json[dayClassName[j]].th_base_city || json[dayClassName[j]].th_base_name))
					{
						value = json[dayClassName[j]].th_base_city;
						if(!value) value = json[dayClassName[j]].th_base_name;
						if(json[dayClassName[j]].th_base_city&&json[dayClassName[j]].th_base_name)
							value += " "+json[dayClassName[j]].th_base_name;
						if(value.length>0) value = value.replace(/"/g,'&quot;');
					}
					tr_html+='<td style="width:140px;"><input class="'+dayClassName[j]+'" onclick="window.showDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'"/></td>';
				}
			}
			else if(j==2)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].hotel_base_dm)
				{
					//value = json[dayClassName[j]].hotel_base_xc;
					if(json[dayClassName[j]].hotel_base_dm)
						value += json[dayClassName[j]].hotel_base_dm;
					//console.log(value);
					if(value.length>0) value = value.replace(/"/g,'&quot;');
					//console.log(value);
				}// onmouseover="window.showHotelDiv(this)" onmouseout="window.daysInputClick(this)"
				tr_html+='<td style="width:210px;"><input class="'+dayClassName[j]+'" onclick="window.showHotelDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)"  value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==3 || j==7)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].textarea_base)
					value = json[dayClassName[j]].textarea_base;
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td';
				if(j==7)
				{
					tr_html+=' style="width:120px;">';
					var now_date = new Date();
					if(value && now_date.getTime()<startDate.getTime())
					{
						var hotel_info = json[dayClassName[2]];
						for(var k=1;k<=5;k++)
						{
							var cancel_key = 'hotel_cancelzc'+k+'_day';
							var cancel_bfb = 'hotel_cancelzc'+k+'_bfb';
							if(hotel_info[cancel_key]&&hotel_info[cancel_bfb])
							{
								var days = hotel_info[cancel_key].replace('－','-').split('-');
								var cancel_day = parseInt(days[0]);
								if(!isNaN(cancel_day))
								{
									var cancel_date = new Date(dateformat(json.date));
									cancel_date.setDate(cancel_date.getDate()-cancel_day);
									var time = cancel_date.getTime()-now_date.getTime();
									var time_day = parseInt(time/1000/3600/24);
									//now_date.setDate(now_date.getDate()+6);
									//if(now_date.getFullYear() == cancel_date.getFullYear() && now_date.getMonth() == cancel_date.getMonth() && now_date.getDate() == cancel_date.getDate())
									if(time_day>0&&time_day<=5)
									{
										var alert_info = {};
										if(hotelAlert[rid]) alert_info = hotelAlert[rid];
										alert_info[i+1] = [hotel_info[cancel_key],'第'+(i+1)+'天的酒店，在'+(startDate.getMonth()+1)+'.'+day+'前'+hotel_info[cancel_key]+'天，可退'+hotel_info[cancel_bfb]+'%，现在还剩下'+time_day+'天退改期限。',value,hotel_info.hotel_base_dm];
										//hotelAlert.push({rid:[i+1,hotel_info[cancel_key]+'天内,可退'+hotel_info[cancel_bfb]+'%']});
										hotelAlert[rid] = alert_info;
										break;
									}
									else
									{
										if(days.length >1)
										{
											cancel_day = parseInt(days[1]);
											if(!isNaN(cancel_day))
											{
												var cancel_date = new Date(dateformat(json.date));
												cancel_date.setDate(cancel_date.getDate()-cancel_day);
												var time = cancel_date.getTime()-now_date.getTime();
												var time_day = parseInt(time/1000/3600/24);
												if(time_day>0&&time_day<=5)
												{
													var alert_info = {};
													if(hotelAlert[rid]) alert_info = hotelAlert[rid];
													alert_info[i+1] = [hotel_info[cancel_key],'第'+(i+1)+'天的酒店，在'+(startDate.getMonth()+1)+'.'+day+'前'+hotel_info[cancel_key]+'天，可退'+hotel_info[cancel_bfb]+'%，现在还剩下'+time_day+'天退改期限。',value,hotel_info.hotel_base_dm];
													hotelAlert[rid] = alert_info;
													break;
												}
											}
										}
									}
								}
							}
						}
					}
				}
				else if(j==3) tr_html+=' style="width:120px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showTextAreaDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==8)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].bus_base)
					value = json[dayClassName[j]].bus_base;
				if(value.length==0)
				{
					if(json[dayClassName[j]] && json[dayClassName[j]].simple_base)
						value = json[dayClassName[j]].simple_base;
				}
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td style="min-width:20px;max-width:130px;width:150px;"><input class="'+dayClassName[j]+'" onclick="window.showBusDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)"  value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==6)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].other_base_shuoming)
					value = json[dayClassName[j]].other_base_shuoming;
				if(value.length == 0)
				{
					if(json[dayClassName[j]] && json[dayClassName[j]].other_base_dm)
						value = json[dayClassName[j]].other_base_dm;
				}
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td';
				if(j==6) tr_html+=' style="width:60px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showHotelOtherDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==1 || j==9)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].simple_base)
					value = json[dayClassName[j]].simple_base;
				if(value.length==0 && j==1)
				{
					if(json['hotel_name'] && json['hotel_name'].hotel_base_xc)
					{
						value = json['hotel_name'].hotel_base_xc;
					}
				}
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td';				//else if(j==10) tr_html+=' style="max-width:70px;">';
				if(j==7) tr_html+=' style="width:110px;">';
				else if(j==9) tr_html+=' style="width:80px;">';
				else if(j==6) tr_html+=' style="width:60px;">';
				else if(j==1) tr_html+=' style="width:186px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showSimpleDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==11)
			{
				if(json[dayClassName[j]])
				{
					if(json[dayClassName[j]].breakfast_base)
					{
						value = "B"+json[dayClassName[j]].breakfast_base;
					}
					if (json[dayClassName[j]].lunch_base)
					{
						if(value.length>0) value += "、L"+json[dayClassName[j]].lunch_base;
						else  value = "L"+json[dayClassName[j]].lunch_base;
					}
					if(json[dayClassName[j]].dinner_base)
					{
						if(value.length>0) value += "、D"+json[dayClassName[j]].dinner_base;
						else  value = "D"+json[dayClassName[j]].dinner_base;
					}
					if(value.length ==0)
					{
						if(json[dayClassName[j]].lunchdinner_zhushi) value = json[dayClassName[j]].lunchdinner_zhushi;
					}
					if(value.length>0) value = value.replace(/"/g,'&quot;');
				}
				tr_html+='<td style="width:110px"><input class="'+dayClassName[j]+'" onclick="window.showDinnerDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==12)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].jingdian1_base)
				{
					value = json[dayClassName[j]].jingdian1_base;
					for(var k=2;k<=5;k++)
					{
						var key = 'jingdian'+k+'_base';
						if(json[dayClassName[j]][key])
						{
							value += '、'+json[dayClassName[j]][key];
						}
					}
					if(value.length>0) value = value.replace(/"/g,'&quot;');
				}
				tr_html+='<td class="jingdian_td" style="width:70px;"><input class="'+dayClassName[j]+'" onclick="window.showJingDianDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==13)
			{
				if(json[dayClassName[j]]&&(json[dayClassName[j]].hb_arrive1_base_hbh||json[dayClassName[j]].hb_arrive2_base_hbh||json[dayClassName[j]].hb_arrive3_base_hbh||json[dayClassName[j]].hb_arrive4_base_hbh||json[dayClassName[j]].hb_arrive5_base_hbh))
				{
					var hb_index = 0;
					if(json[dayClassName[j]].hb_arrive1_base_hbh) hb_index = 1;
					else if(json[dayClassName[j]].hb_arrive2_base_hbh) hb_index = 2;
					else if(json[dayClassName[j]].hb_arrive3_base_hbh) hb_index = 3;
					else if(json[dayClassName[j]].hb_arrive4_base_hbh) hb_index = 4;
					else if(json[dayClassName[j]].hb_arrive5_base_hbh) hb_index = 5;
					value = ''+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_hbh'];
					//if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_date']) value += ' '+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_date'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_code']) value += ' '+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_code'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_qfsj']) value += ' '+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_qfsj'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_ddsj']) value += '/'+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_ddsj'];
					for(var k=1;k<=5;k++)
					{
						if(k==hb_index) continue;
						var key = 'hb_arrive'+k+'_base';
						var v ='';
						if(json[dayClassName[j]][key+'_hbh'])
						{
							v = json[dayClassName[j]][key+'_hbh'];
							//if(json[dayClassName[j]][key+'_date']) v += ' '+json[dayClassName[j]][key+'_date'];
							if(json[dayClassName[j]][key+'_code']) v += ' '+json[dayClassName[j]][key+'_code'];
							if(json[dayClassName[j]][key+'_qfsj']) v += ' '+json[dayClassName[j]][key+'_qfsj'];
							if(json[dayClassName[j]][key+'_ddsj']) v += '/'+json[dayClassName[j]][key+'_ddsj'];
						}
						if(v.length>0) value += '、'+v;

					}
				}
				if(json[dayClassName[j]]&&(json[dayClassName[j]].hb_leave1_base_hbh||json[dayClassName[j]].hb_leave2_base_hbh||json[dayClassName[j]].hb_leave3_base_hbh||json[dayClassName[j]].hb_leave4_base_hbh||json[dayClassName[j]].hb_leave5_base_hbh))
				{
					var hb_index = 0;
					if(json[dayClassName[j]].hb_leave1_base_hbh) hb_index = 1;
					else if(json[dayClassName[j]].hb_leave2_base_hbh) hb_index = 2;
					else if(json[dayClassName[j]].hb_leave3_base_hbh) hb_index = 3;
					else if(json[dayClassName[j]].hb_leave4_base_hbh) hb_index = 4;
					else if(json[dayClassName[j]].hb_leave5_base_hbh) hb_index = 5;
					if(value.length>0) value += '；'+json[dayClassName[j]]['hb_leave'+hb_index+'_base_hbh'];
					else value = ''+json[dayClassName[j]]['hb_leave'+hb_index+'_base_hbh'];
					//if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_date']) value += ' '+json[dayClassName[j]]['hb_leave'+hb_index+'_base_date'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_code']) value += ' '+json[dayClassName[j]]['hb_leave'+hb_index+'_base_code'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_qfsj']) value += ' '+json[dayClassName[j]]['hb_leave'+hb_index+'_base_qfsj'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_ddsj']) value += '/'+json[dayClassName[j]]['hb_leave'+hb_index+'_base_ddsj'];
					for(var k=1;k<=5;k++)
					{
						if(k==hb_index) continue;
						var key = 'hb_leave'+k+'_base';
						var v ='';
						if(json[dayClassName[j]][key+'_hbh'])
						{
							v = json[dayClassName[j]][key+'_hbh'];
							//if(json[dayClassName[j]][key+'_date']) v += ' '+json[dayClassName[j]][key+'_date'];
							if(json[dayClassName[j]][key+'_code']) v += ' '+json[dayClassName[j]][key+'_code'];
							if(json[dayClassName[j]][key+'_qfsj']) v += ' '+json[dayClassName[j]][key+'_qfsj'];
							if(json[dayClassName[j]][key+'_ddsj']) v += '/'+json[dayClassName[j]][key+'_ddsj'];
						}
						if(v.length>0) value += '、'+v;
					}
				}
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showAirPortDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else
			{
				if(j==10) continue;
				tr_html+='<td style="width:';
				if(j==1) tr_html+='60px;">';
				else tr_html+='36px;">';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.daysInputClick(this)" value="'+(json[dayClassName[j]] ? json[dayClassName[j]].replace(/"/g,'&quot;') : "")+'" onchange="window.daysInputChange(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
		}
	tr_html += '</tr>';
	return tr_html;
  }
  function summaryData(r,s_key)
  {
  	if(!r || !r.ext || !r.ext.days) return 0;
  	var s_days = r.ext.days;
  	var s_result = 0;
  	for(var key in s_days)
  	{
  		var s_day = s_days[key];
  		var s_key_data = s_day[s_key];
  		if(s_key_data)
  		{
  			if(s_key == 'tuanhao')
  			{
  				if(s_key_data.th_total) s_result = eval(s_result+'+'+s_key_data.th_total);
  			}
  			else if(s_key == 'hotel_name')
  			{
  				//if(s_key_data.hotel_total_price) s_result = eval(s_result+'+'+s_key_data.hotel_total_price);
  				var d_num = s_day.hotel_double?s_day.hotel_double:0;
  				var s_num = s_day.hotel_single?s_day.hotel_single:0;
  				var d_price = s_key_data.hotel_double_price?s_key_data.hotel_double_price:0;
  				var s_price = s_key_data.hotel_single_price?s_key_data.hotel_single_price:0;
  				var t_price = eval(d_num+'*'+d_price+'+'+s_num+'*'+s_price);
  				if(isNaN(t_price)) t_price = 0;
  				var expression = getExpression(s_key_data.hotel_baojie);
  				var r = eval(expression);
  				if(!isNaN(r))
  				{
  					t_price = eval(r+'+'+ t_price);
  				}
  				s_result = eval(s_result+'+'+t_price);
  			}
  			else if(s_key == 'hotel_sidao')
  			{
  				if(s_key_data.other_total_price) s_result = eval(s_result+'+'+s_key_data.other_total_price);
  			}
  			else if(s_key == 'bus_company')
  			{
  				if(s_key_data.bus_price)
  				{
  					var expression = getExpression(s_key_data.bus_price);
  					r = eval(expression);
  					if(isNaN(r))
  					{
  						r = 0;
  					}
  					s_result = eval(s_result+'+'+r);
  				}
  			}
  			else if(s_key == 'dinner')
  			{
  				if(s_key_data.lunch_price)
  				{
  					var expression = getExpression(s_key_data.lunch_price);
  					r = eval(expression);
  					if(isNaN(r))
  					{
  						r = 0;
  					}
  					s_result = eval(s_result+'+'+r);
  				}
  				if(s_key_data.dinner_price)
  				{
  					var expression = getExpression(s_key_data.dinner_price);
  					r = eval(expression);
  					if(isNaN(r))
  					{
  						r = 0;
  					}
  					s_result = eval(s_result+'+'+r);
  				}
  			}
  			else if(s_key == 'jingdian')
  			{
  				var r = 0;
  				for(var i=1;i<=5;i++)
  				{
  					if(s_key_data['jingdian'+i+'_xq_price'])
  					{
  						var expression = getExpression(s_key_data['jingdian'+i+'_xq_price']);
  						var r_r = eval(expression);
  						if(!isNaN(r_r))
  						{
  							r += r_r;
  						}
  					}
  				}
  				s_result = eval(s_result+'+'+r);
  			}
  			else if(s_key == 'airport')
  			{
  				var r = 0;
  				for(var i=1;i<=5;i++)
  				{
  					if(s_key_data['hb_arrive'+i+'_info_price'])
  					{
  						var expression = getExpression(s_key_data['hb_arrive'+i+'_info_price']);
  						var r_r = eval(expression);
  						if(!isNaN(r_r))
  						{
  							r += r_r;
  						}
  					}
  					if(s_key_data['hb_leave'+i+'_info_price'])
  					{
  						var expression = getExpression(s_key_data['hb_leave'+i+'_info_price']);
  						var r_r = eval(expression);
  						if(!isNaN(r_r))
  						{
  							r += r_r;
  						}
  					}
  				}
  				s_result = eval(s_result+'+'+r);
  			}
  		}
  	}
  	return s_result;
  }
  function updateSummaryData(t)
  {
  	var update_tr = $(t).parent().parent();
  	var rid = $(t).attr('id');
  	var update_room = findRoomByRid(rid);
  	if(update_room)
  	{
  		var th_r = summaryData(update_room,'tuanhao');
  		if(th_r>0)
  		{
  			var span = $(update_tr).find(".summary_th").get(0);
  			if(span)
  			{
  				$(span).text(th_r);
  			}
  		}
  		var hotel_r = summaryData(update_room,'hotel_name');
  		var hotel_r_other = summaryData(update_room,'hotel_sidao');
  		var hotel_t = hotel_r+hotel_r_other;
  		if(hotel_t>0)
  		{
  			var span = $(update_tr).find(".summary_hotel").get(0);
  			if(span)
  			{
  				$(span).text(hotel_t);
  			}
  		}
  		var bus_r = summaryData(update_room,'bus_company');
  		if(bus_r>0)
  		{
  			var span = $(update_tr).find(".summary_bus").get(0);
  			if(span)
  			{
  				$(span).text(bus_r);
  			}
  		}
  		var dinner_r = summaryData(update_room,'dinner');
  		if(dinner_r>0)
  		{
  			var span = $(update_tr).find(".summary_dinner").get(0);
  			if(span)
  			{
  				$(span).text(dinner_r);
  			}
  		}
  		var jingdian_r = summaryData(update_room,'jingdian');
  		if(jingdian_r>0)
  		{
  			var span = $(update_tr).find(".summary_jingdian").get(0);
  			if(span)
  			{
  				$(span).text(jingdian_r);
  			}
  		}
  		var airport_r = summaryData(update_room,'airport');
  		if(airport_r>0)
  		{
  			var span = $(update_tr).find(".summary_airport").get(0);
  			if(span)
  			{
  				$(span).text(airport_r);
  			}
  		}
  		if(th_r+hotel_t+bus_r+dinner_r+jingdian_r+airport_r>0)
  		{
  			var span = $(update_tr).next().find(".summary_total").get(0);
  			if(span)
  			{
  				$(span).text(th_r+'+'+hotel_t+'+'+bus_r+'+'+dinner_r+'+'+jingdian_r+'+'+airport_r+'='+(th_r+hotel_t+bus_r+dinner_r+jingdian_r+airport_r));
  				var span_profit = $(update_tr).next().next().find(".summary_profit").get(0);
  				if(span_profit)
  				{
  					var profit_text = $(span_profit).text();
  					var profit_text_prev = profit_text.substring(0,profit_text.indexOf('-'));
  					//console.log(profit_text_prev);
  					if(!profit_text_prev) profit_text_prev = '0';
  					var cb_result = th_r+hotel_t+bus_r+dinner_r+jingdian_r+airport_r;
  					var p_result = eval(profit_text_prev+'-'+cb_result);
  					$(span_profit).text(profit_text_prev+'-'+cb_result+'='+p_result);
  				}
  			}
  		}
  	}
  }
  window.updateSummaryData = updateSummaryData;
  function getNumber(string)
  {
  	if(!isNaN(string)) return string;
  	var expression = '';
  	for(var i=0;i<string.length;i++)
  	{
  		chart = string.charAt(i);
  		if(!isNaN(chart) || chart=='.' || chart=='。')
  		{
  			expression += chart;
  		}
  	}
  	return expression?expression:0;
  }
  function summaryDataHtml(data)
  {
  	var s_html = '';
  	s_html +='<tr><td colspan="2" style="text-align:center;padding:5px 0 5px 0;"><span id="'+data._id+'" style="cursor:pointer;" onclick="window.updateSummaryData(this)">计费</span></td>';
  	s_html +='<td colspan="2">';
  	var th_r = summaryData(data,'tuanhao');
  	//if(th_r>0)
  	{
  		s_html +='<span class="summary_th">'+th_r+'</span>';
  	}
  	s_html +='</td>';
  	s_html +='<td colspan="6">';
  	var hotel_r = summaryData(data,'hotel_name');
  	var hotel_r_other = summaryData(data,'hotel_sidao');
  	var hotel_t = hotel_r+hotel_r_other;
  	//if(hotel_t>0)
  	{
  		s_html +='<span class="summary_hotel">'+hotel_t+'</span>';
  	}
  	s_html +='</td>';
  	s_html +='<td colspan="2">';
  	var bus_r = summaryData(data,'bus_company');
  	//if(bus_r>0)
  	{
  		s_html +='<span class="summary_bus">'+bus_r+'</span>';
  	}
  	s_html +='</td>';
  	s_html +='<td>';
  	var dinner_r = summaryData(data,'dinner');
  	//if(dinner_r>0)
  	{
  		s_html +='<span class="summary_dinner">'+dinner_r+'</span>';
  	}
  	s_html +='</td>';
  	s_html +='<td>';
  	var jingdian_r = summaryData(data,'jingdian');
  	//if(jingdian_r>0)
  	{
  		s_html +='<span class="summary_jingdian">'+jingdian_r+'</span>';
  	}
  	s_html +='</td>';
  	s_html +='<td>';
  	var airport_r = summaryData(data,'airport');
  	//if(airport>0)
  	{
  		s_html +='<span class="summary_airport">'+airport_r+'</span>';
  	}
  	s_html +='</td>';
    s_html +='</tr>';
    s_html +='<tr><td colspan="2" style="text-align:center;padding:5px 0 5px 0;"><span>总计</span></td>';
    s_html +='<td colspan="13">';
    s_html +='<span class="summary_total">'+th_r+'+'+hotel_t+'+'+bus_r+'+'+dinner_r+'+'+jingdian_r+'+'+airport_r+'='+(th_r+hotel_t+bus_r+dinner_r+jingdian_r+airport_r)+'</span>';
  	s_html +='</td></tr>';
  	s_html +='<tr><td colspan="2" style="text-align:center;padding:5px 0 5px 0;"><span>利润</span></td>';
    s_html +='<td colspan="13">';
    s_html +='<span class="summary_profit">';
    if(data.ext.line_gys_price || data.ext.line_traveler_price)
    {
    	var t_price = data.ext.line_traveler_price?getNumber(data.ext.line_traveler_price):0;
    	var exp = t_price + '-';
    	exp +=data.ext.line_gys_price?getNumber(data.ext.line_gys_price):0;
    	var r_total = eval(exp);
    	s_html +=''+exp+'='+r_total;
    }
    else if(data.ext.line_total_price)
    {
    	var exp = getNumber(data.ext.line_total_price) + '-';
    	if(data.ext.add_price)
    	{
    		exp +=getNumber(data.ext.add_price)+'-';
    	}
    	exp +=''+(th_r+hotel_t+bus_r+dinner_r+jingdian_r+airport_r)
    	var r_total = eval(exp);
    	s_html +=''+exp+'='+r_total;
    }
    s_html +='</span>';
  	s_html +='</td></tr>';
  	return s_html;
  }
  function tbodyHTML(contents)
  {
  	var tbody_html ='';
  	for(var index in contents)
    {
        var single = contents[index];
        if(rooms.length>1)
        {
        	var mc = single.name;
        	if(!mc)
        	{
        		if(single.t == "d")
        		{
        			var usn = single.usernames;
        			mc = usn[0] +"<->"+ usn[1];
        		}
        	}
        	tbody_html +='<tr><td colspan="15"><span style="font-size:18px;color:gray">组的名称：'+mc+'</span></td></tr>';
        }
        //if(single.ext.name)
        {
        	var info = single.ext;
        	tbody_html +='<tr>';
        	tbody_html +='<td style="border-bottom: 1px dashed #ddd;" colspan="15"><span>项目名称：<input id="'+single._id+'" style="width:340px;border:0px;height:25px;" class="name" placeholder="项目名称" onclick="window.daysInputClick(this)" value="'+(info.name ? info.name : "")+'" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>组团单位：<input id="'+single._id+'" style="width:300px;border:0px;height:25px;" class="ztdanwei" placeholder="组团单位" onclick="window.daysInputClick(this)" value="'+(info.ztdanwei ? info.ztdanwei : "")+'"  onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>团号：<input id="'+single._id+'" style="width:200px;border:0px;height:25px;" class="zttuanhao" placeholder="团号" onclick="window.daysInputClick(this)" value="'+(info.zttuanhao ? info.zttuanhao : "")+'"  onchange="window.inputChange(this,\''+single._id+'\')" /></span></td></tr>';
        	tbody_html +='<tr><td style="border-bottom: 1px dashed #ddd;" colspan="15"><span>大人人数：<input id="'+single._id+'" style="width:50px;border:0px;height:25px;" value="'+(info.adult_number ? info.adult_number : "")+'" class="adult_number" onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>儿童人数：<input id="'+single._id+'" style="width:50px;border:0px;height:25px;" value="'+(info.children_number ? info.children_number : "")+'" class="children_number"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>人员组成：<input id="'+single._id+'" style="width:272px;border:0px;height:25px;" value="'+(info.personnel_number ? info.personnel_number : "")+'" class="personnel_number"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>开始日期：<input id="start-date'+single._id+'" style="width:100px;border:0px;height:25px;" value="'+(info.startdate ? info.startdate : "")+'" class="startdate" onclick="window.daysInputClick(this)" /></span>';
        	tbody_html +='<span>结束日期：<input id="end-date'+single._id+'" style="width:100px;border:0px;height:25px;" value="'+(info.enddate ? info.enddate : "")+'" class="enddate"  onclick="window.daysInputClick(this)" onchange="window.dateChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>报价：<input id="'+single._id+'" style="width:100px;border:0px;height:25px;" value="'+(info.line_total_price ? info.line_total_price : "")+'" class="line_total_price"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>附加费用：<input id="'+single._id+'" style="width:100px;border:0px;height:25px;" value="'+(info.add_price ? info.add_price : "")+'" class="add_price"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='</td></tr>';
        	tbody_html +='<tr><td colspan="15"><span>供应商信息：<input id="'+single._id+'" style="width:200px;border:0px;height:25px;" value="'+(info.line_gys_info ? info.line_gys_info.gys_name?info.line_gys_info.gys_name:"" : "")+'" class="line_gys_info"  onclick="window.showLineGYSDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" /></span><span>供应商报价：<input id="'+single._id+'" style="width:100px;border:0px;height:25px;" value="'+(info.line_gys_price ? info.line_gys_price : "")+'" class="line_gys_price"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>收客价：<input id="'+single._id+'" style="width:100px;border:0px;height:25px;" value="'+(info.line_traveler_price ? info.line_traveler_price : "")+'" class="line_traveler_price"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
			tbody_html +='<span>费用包含：<input id="'+single._id+'" style="width:200px;border:0px;height:25px;" value="'+(info.line_fee_in ? info.line_fee_in.substring(0,30) : "")+'" class="line_fee_in"  onclick="window.showLineTextAreaDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" /></span>';
			tbody_html +='<span>费用不含：<input id="'+single._id+'" style="width:200px;border:0px;height:25px;" value="'+(info.line_fee_nin ? info.line_fee_nin.substring(0,30) : "")+'" class="line_fee_nin"  onclick="window.showLineTextAreaDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" /></span>';
			tbody_html +='<span>注意事项：<input id="'+single._id+'" style="width:200px;border:0px;height:25px;" value="'+(info.line_note ? info.line_note.substring(0,30) : "")+'" class="line_note"  onclick="window.showLineTextAreaDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" /></span>';
			tbody_html +='<span>附加协议：<input id="'+single._id+'" style="width:200px;border:0px;height:25px;" value="'+(info.line_fjxy ? info.line_fjxy.substring(0,30) : "")+'" class="line_fjxy"  onclick="window.showLineTextAreaDiv(this)" onmouseover="window.mouseOverShow(this)" onmouseout="window.mouseOutHide(this)" /></span>';
			tbody_html +='</td></tr>';

        	if(info.days)
        	{
        		var days = info.days;
        		var qstartdate = new Date(info.startdate);
  				var qenddate = new Date(info.enddate);
  				var time = qenddate.getTime() - qstartdate.getTime();
  				var length = time/1000/3600/24;
  				var firstDate = new Date(info.startdate);
        		//if(days['1'])
        		{
        			var day_length = 0;
        			for(var key in days)
        			{
        				var td = days[key];
        				var tdDate = new Date(dateformat(td.date));
        				if(tdDate && tdDate.getTime() > firstDate.getTime())
        				{
        					var tdDay = (tdDate.getTime() - firstDate.getTime())/1000/3600/24;
        					var tr_html = trHtml(firstDate,day_length,day_length+tdDay-1,single._id);
  							tbody_html += tr_html;
  							day_length += tdDay;

  							tr_html = trHTMLByJSON(td,single._id,key);
        					tbody_html += tr_html;
        					day_length += 1;
        					firstDate.setDate(firstDate.getDate()+1);
        				}
        				else
        				{
        					var tr_html = trHTMLByJSON(td,single._id,key);
        					tbody_html += tr_html;
        					day_length += 1;
        					firstDate.setDate(firstDate.getDate()+1);
        				}
        				if(day_length > length)
        				{
        					break;
        				}
        			}
        			if(day_length < (length+1))
        			{
        				qstartdate.setDate(qstartdate.getDate()+day_length);
        				var tr_html = trHtml(qstartdate,day_length,length,single._id);
  						tbody_html += tr_html;
        			}
        		}
        		/*else
        		{
  					var tr_html = trHtml(qstartdate,0,length,single._id);
  					tbody_html += tr_html;
        		}//*/
        	}
        	if(info.days) tbody_html += summaryDataHtml(single);
        }
    }
    return tbody_html;
  }
  function showAlert()
  {
  	//console.log(hotelAlert);
  	for(var key in hotelAlert)
  	{
  		var alert_info = hotelAlert[key];
  		var room = findRoomByRid(key);
  		var mc = room.ext.name;
  		if(!mc) mc = room.name;
        if(!mc)
        {
        	if(room.t == "d")
        	{
        		usn = room.usernames;
        		mc = usn[0] +"<->"+ usn[1];
        	}
        }
  		for(var day_key in alert_info)
  		{
  			var value = alert_info[day_key];
  			var show_info = localStorage.getItem(key+day_key+value[0]);
  			if(!show_info)
  			{
  				if(rooms.length>1)
  				{
  					if(!confirm('项目（组）的名称：'+mc+'\n酒店名：'+value[3]+'\n预订号：'+value[2]+' \n\n'+value[1]))
  					{
  						localStorage.setItem(key+day_key+value[0],'1');
  					}
  				}
  				else
  				{
  					if(!confirm('项目（组）的名称：'+mc+'\n酒店名：'+value[3]+'\n预订号：'+value[2]+' \n\n'+value[1]))
  					{
  						localStorage.setItem(key+day_key+value[0],'1');
  					}
  				}
  			}
  		}
  	}
  }
  function changeTabPage(t,index)
  {
  	var hotelAlert = {};
  	var className = $(t).attr("class");
  	if(className=="on") return;
  	var div = $(t).parent();
  	var lion = $(div).find("li.on").get(0)
  	if(lion)
  	{
  		$(lion).attr("class","off");
  		$(t).attr("class","on");
  	}
  	else return;

  	var html = '';
  	var room = [];
  	if(index==0)
  	{
  		html = tbodyHTML(rooms);
  	}
  	else if(index == 13)
  	{
  		for(var i in rooms)
  		{
  			var r = rooms[i];
  			if(!r.ext.startdate)
  			{
  				room.push(r);
  			}
  		}
  		html = tbodyHTML(room);
  	}
  	else if(index==14)
  	{
  		html = tbodyHTML(room);
  	}
  	else
  	{
  		for(var i in rooms)
  		{
  			var r = rooms[i];
  			if(r.ext.startdate)
  			{
  				var d = new Date(r.ext.startdate);
  				if(d.getMonth()+1 == index)
  				{
  					room.push(r);
  				}
  			}
  		}
  		html = tbodyHTML(room);
  	}
  	var tbody = $(div).next().find("tbody.tbody_content").get(0);
  	if(tbody)
  	{
  		$(tbody).html(html);
  		td_switch = false;
  		for(var index in room)
  		{
  			$("#start-date"+(room[index]._id)).datepicker();
  			$("#end-date"+(room[index]._id)).datepicker();
  		}
  		setTimeout(function(){showAlert()},800);
  	}
  }
  window.changeTabPage = changeTabPage;
  function tabPageHTML()
  {
  	var tab_html = '';
  	tab_html+='<div id = "tab_page" style="margin-top:-20px;">';
  	for(var i=0;i<15;i++)
  	{
  		if(i==0) tab_html += '<li class="on" onclick="window.changeTabPage(this,'+i+')">全部</li>';
  		else if(i==13)
  		{
  			tab_html += '<li class="off" onclick="window.changeTabPage(this,'+i+')">New</li>';
  		}
  		else if(i==14)
  		{
  			//tab_html += '<li class="off" onclick="window.changeTabPage(this,'+i+')">其他</li>';
  		}
  		else
  		{
  			tab_html += '<li class="off" onclick="window.changeTabPage(this,'+i+')">'+i+'月</li>';
  		}
  	}
  	tab_html+='</div>';
  	return tab_html;
  }
	var html = '<div class="content"><div class="extcontent">';
	if(showTitle)
	{
		html+=tabPageHTML();
	}//<th class="third" rowspan="2"><div class="th-inner" style="width:50px;">人数</div></th>
	html+='<div class="fixed-table-container complex"><div class="header-background"> </div><div class="fixed-table-container-inner" style="height:'+(height-108)+'px;">';
	html+='<table cellspacing="0"><thead><tr class="complex-top">';
	html+='<th class="third" rowspan="2"><div class="th-inner" style="width:20px;">星期</div></th><th class="third" rowspan="2"><div class="th-inner">日期</div></th>';
	html+='<th class="third" rowspan="2"><div class="th-inner">导游</div></th>';
	html+='<th class="third" rowspan="2"><div class="th-inner">行程</div></th>';
	html+='<th class="second" colspan="6"><div class="th-inner" style="width:50%;text-align:center;">酒店</div></th>';
	html+='<th class="third" rowspan="2"><div class="th-inner">车公司</div></th><th class="third" rowspan="2"><div class="th-inner">用车时间</div></th>';
	html+='<th class="third" rowspan="2"><div class="th-inner">用餐</div></th><th class="third" rowspan="2"><div class="th-inner jingdian_div" style="cursor:pointer;">景点门票</div></th><th class="third" rowspan="2"><div class="th-inner">抵达／离开时间</div></th></tr>';
	html+='<tr class="complex-bottom"><th class="second"><div class="th-inner">酒店名</div></th>';
	html+='<th class="second"><div class="th-inner">付款</div></th><th class="second"><div class="th-inner">双</div></th>';
	html+='<th class="second"><div class="th-inner">单</div></th><th class="second"><div class="th-inner">其他</div></th><th class="second"><div class="th-inner">预定号</div></th></tr></thead><tbody class="tbody_content">';

    html+= tbodyHTML(ext);

    html+="</tbody></table></div></div></div></div>";
	var id = (new Date()).getTime();

  function close() {
    $("body").unbind('click');
    $(".tablecontainer").remove();
  	$(".tablesimple").remove();
  	$(".tabledinner").remove();
  	$(".tablehotel").remove();
  	$(".tablejingdian").remove();
  	$(".tableairport").remove();
  	$(".tableTextAreaDiv").remove();
  	$(".mouse_show_div").remove();
  	$(".tablebus").remove();
  	$(".tablehotelother").remove();
  	$(".lineTextAreaDiv").remove();
  	$(".lineGYSDiv").remove();
  	saveLocalStorage();
  	if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
    setTimeout(function() {
      var doc = document.getElementById(id);
      $(doc).remove();
      if(timeOutShow) clearTimeout(timeOutShow),timeOutShow = null;
      $(".mouse_show_div").remove();
    }, 500);
  }
  window.closeRoomExt = close;

  var div = document.createElement("div");
  div.setAttribute("id",id);
  div.setAttribute("width",width);
  div.setAttribute("height",height);
  div.setAttribute("class","treecontainer");
  $(div).append(html);
  $("body").append(div);

  var input = document.createElement("input");
  document.getElementById(id).appendChild(input);
  input.setAttribute("id", "exit" + id);
  input.setAttribute("type", "button");
  input.setAttribute("class", "treeclose");
  input.value = "X";
  input.setAttribute("onclick","window.closeRoomExt();");
  $(input).css({"line-height":"0px","top":"7px","right":"18px","height":"25px","width":"20px"});
  for(var index in ext)
  {
  	$("#start-date"+(ext[index]._id)).datepicker();
  	$("#end-date"+(ext[index]._id)).datepicker();
  }
  setTimeout(function(){showAlert()},800);
  $("body").on('click',function(e){
  	//console.log($(e.target));
  	e.preventDefault();
  	if(!show || !currentShowDiv || $(e.target).is('input')) return;
  	//console.log(e.target);
  	var className = $(e.target).attr('class');
  	var children = $(currentShowDiv).find(e.target);
  	//var tableChildren = $(".fixed-table-container-inner").find('.'+className);
  	//console.log(className);
  	//console.log(children);
  	var divClassName = $(currentShowDiv).attr('class');
  	if(children.length == 0 && (divClassName == "tableairport" || divClassName == "tablejingdian"))
  	{
  		var dateDiv = $("#ui-datepicker-div");
  		if(dateDiv&&dateDiv.length>0 && className)
  		{
  			children = $(dateDiv).find('.'+className.split(' ')[0]);
  		}
  		//console.log(children);
  	}
  	else if(children.length == 0 && (divClassName == "tablehotel" || divClassName == "tablehotelother"))
  	{
  		//console.log(e.target);
  		if(className == 's_close')
  			children = 1;
  	}
  	if((className == $(".fixed-table-container-inner").attr('class')) || children.length == 0)
  	{
  		daysInputClick(t);
  	}
  });
  $(".jingdian_div").on('click',function(e){
  	e.preventDefault();
  	if(!td_switch)
  	{
  		td_switch = true;
  		$("td.jingdian_td").css('width','auto');
  		$(".complex-top .th-inner").css('top',1);
  		$(".complex-bottom .th-inner").css('top',31);
  		setTimeout(function(){$(".complex-top .th-inner").css('top',0),$(".complex-bottom .th-inner").css('top',30);},200);
  	}
  	else
  	{
  		td_switch = false;
  		$("td.jingdian_td").css('width','70px');
  		$(".complex-top .th-inner").css('top',-1);
  		$(".complex-bottom .th-inner").css('top',29);
  		setTimeout(function(){$(".complex-top .th-inner").css('top',0),$(".complex-bottom .th-inner").css('top',30);},200);
  	}
  });
  /*function printTrHtml(date,begin,length,rid)
  {
  	var tr_html = '';
  	var startDate = date;
  	for(var i=begin;i<=length;i++)
	{
		tr_html+='<tr class="day" data-days="'+(i+1)+'">';
		w = startDate.getDay();
		month = startDate.getMonth()+1;
		if(month>12) month = 1;
		if(w == 0 || w==5 || w==6)
		{
			tr_html +='<td><span style="color:red;">';
		}
		else
		{
			tr_html +='<td><span>';
		}
		day = startDate.getDate();
		if(day<10) day = '0'+day;
		tr_html +=weekDays[w]+'</span></td><td><span style="display:none;">'+month+'/'+day+'/'+startDate.getFullYear()+'</span><span>'+month+'/'+day+'</span></td>'
		for(var j=0;j<14;j++)
		{
			if(j==0)
			{
				//if(i==0)
				//	tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.daysInputClick(this)" onchange="window.daysInputChange(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
				//else
					tr_html+='<td style="width:140px;"><span style="width:100%;border:0px;height:25px;"></span></td>';
			}
			else if(j==2)
				tr_html+='<td style="width:300px;"><span style="width:100%;border:0px;height:25px;"></span></td>';
			else if(j==3 || j==7)
				tr_html+='<td style="width:200px;"><span style="width:100%;border:0px;height:25px;"></span></td>';
			else if(j==8 || j==9 || j==10)
			{
				tr_html+='<td';
				if(j==7) tr_html+=' style="width:110px;">';
				else if(j==9) tr_html+=' style="width:80px;">';
				else tr_html+= '>';
				tr_html+='<span style="width:100%;border:0px;height:25px;"></span></td>';
			}
			else if(j==11 || j==12 || j==13)
				tr_html+='<td><span style="width:100%;border:0px;height:25px;"></span></td>';
			else
			{
				if(j==1) continue;
				tr_html+='<td style="width:';
				if(j==1) tr_html+='60px;">';
				else tr_html+='36px;">';
				tr_html +='<span style="width:100%;border:0px;height:25px;"></span></td>';
			}
		}
		tr_html += '</tr>';
		startDate.setDate(startDate.getDate()+1);
	}
  	return tr_html;
  }
  function printTrHTMLByJSON(json,rid,key)
  {
  	tr_html = '';
  	i = key - 1;
  	var startDate = new Date(dateformat(json.date));
  	tr_html+='<tr  id="'+rid+'" class="day" data-days="'+(i+1)+'">';
		w = startDate.getDay();
		if(w == 0 || w==5 || w==6)
		{
			tr_html +='<td><span style="color:red;">';
		}
		else
		{
			tr_html +='<td><span>';
		}
		day = startDate.getDate();
		if(day<10) day = '0'+day;
		tr_html += (json.week ? json.week : weekDays[w])+'</span></td><td><span style="display:none;">'+json.date+'</span><span>'+(startDate.getMonth()+1)+'/'+day+'</span></td>'
		for(var j=0;j<14;j++)
		{
			var valueHTML = '';
			if(j==0)
			{
				if(json[dayClassName[j]])
				{
					valueHTML='<div><span style="width:75%;">姓名：'+(json[dayClassName[j]].th_base_name ? json[dayClassName[j]].th_base_name : "")+'</span></div>';
  					valueHTML += '<div><span style="width:75%;">城市：'+(json[dayClassName[j]].th_base_city ? json[dayClassName[j]].th_base_city : "")+'</span></div>';
  					valueHTML += '<div><span style="width:75%;">电话：'+(json[dayClassName[j]].th_xmdh ? json[dayClassName[j]].th_xmdh : "")+'</span></div>';
  					valueHTML += '<div><span style="width:75%;">工资：'+(json[dayClassName[j]].th_gongzi ? json[dayClassName[j]].th_gongzi : "")+'</span>';
  					var r='';
  					if(json[dayClassName[j]].th_gongzi)
  					{
  						var expression = getExpression(json[dayClassName[j]].th_gongzi);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					valueHTML += '<span style="width:15%">='+r+'</span></div>';
  					valueHTML += '<div><span style="width:75%;">小费：'+(json[dayClassName[j]].th_fee ? json[dayClassName[j]].th_fee : "")+'</span>';
  					r='';
  					if(json[dayClassName[j]].th_fee)
  					{
  						var expression = getExpression(json[dayClassName[j]].th_fee);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					valueHTML += '<span style="width:15%">='+r+'</span></div>';
  					valueHTML += '<div><span style="width:75%;">餐补：'+(json[dayClassName[j]].th_cfbz ? json[dayClassName[j]].th_cfbz : "")+'</span>';
  					r='';
  					if(json[dayClassName[j]].th_cfbz)
  					{
  						var expression = getExpression(json[dayClassName[j]].th_cfbz);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					valueHTML += '<span style="width:15%">='+r+'</span></div>';
  					valueHTML += '<div><span style="width:75%;">垫付：'+(json[dayClassName[j]].th_df ? json[dayClassName[j]].th_df : "")+'</span>';
  					r='';
  					if(json[dayClassName[j]].th_df)
  					{
  						var expression = getExpression(json[dayClassName[j]].th_df);
  						r = eval(expression);
  						if(isNaN(r))
  						{
  							r = '';
  						}
  					}
  					valueHTML += '<span style="width:15%">='+r+'</span></div>';
  					valueHTML += '<div><span style="width:75%">合计：'+(json[dayClassName[j]].th_total ? json[dayClassName[j]].th_total : "")+'</span></div>';
  					valueHTML += '<div><span style="width:95%">结算：'+(json[dayClassName[j]].th_jiesuan ? json[dayClassName[j]].th_jiesuan : "")+'</span></div>';
  					valueHTML += '<div><span> style="width:95%"报价：'+(json[dayClassName[j]].th_baojie ? json[dayClassName[j]].th_baojie : "")+'</span></div>';
  					valueHTML += '</div>';
				}
				tr_html+='<td style="width:140px;">'+valueHTML+'</td>';
			}
			else if(j==2)
			{
				if(json[dayClassName[j]])
				{
					valueHTML = '<div style="margin-left:6px;margin-top:2px;"><div><span style="width:96.5%;">行程：'+(json[dayClassName[j]].hotel_base_xc ? json[dayClassName[j]].hotel_base_xc : "")+'</span></div>';
  		valueHTML += '<div><span style="width:96.5%;">酒店名：'+(json[dayClassName[j]].hotel_base_dm ? json[dayClassName[j]].hotel_base_dm : "")+'</span></div>';
  		valueHTML += '<div><span style="width:96.5%;">星级：'+(json[dayClassName[j]].hotel_xingji ? json[dayClassName[j]].hotel_xingji : "")+'</span></div>';
  		valueHTML += '<div><span style="width:96.5%;">地址：'+(json[dayClassName[j]].hotel_address ? json[dayClassName[j]].hotel_address : "")+'</span></div>';
  		valueHTML += '<div><span style="margin-left:10px;width:95%;height:120px;">报价：'+(json[dayClassName[j]].hotel_baojie ? json[dayClassName[j]].hotel_baojie : "")+'</span></div>';
  		valueHTML += '<div>取消政策：<div style="margin-left:15px;">';
  		valueHTML += '<div><span style="width:100%;">1：'+(json[dayClassName[j]].hotel_cancelzc1_day ? json[dayClassName[j]].hotel_cancelzc1_day : "-1")+'天内，退款';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc1_bfb ? json[dayClassName[j]].hotel_cancelzc1_bfb : "0")+'％，说明：';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc1_info ? json[dayClassName[j]].hotel_cancelzc1_info : "无")+'</span></div>';

  		valueHTML += '<div><span style="width:100%;">2：'+(json[dayClassName[j]].hotel_cancelzc2_day ? json[dayClassName[j]].hotel_cancelzc2_day : "-1")+'天内，退款';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc2_bfb ? json[dayClassName[j]].hotel_cancelzc2_bfb : "0")+'％，说明：';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc2_info ? json[dayClassName[j]].hotel_cancelzc2_info : "无")+'</span></div>';

  		valueHTML += '<div><span style="width:100%;">3：'+(json[dayClassName[j]].hotel_cancelzc3_day ? json[dayClassName[j]].hotel_cancelzc3_day : "-1")+'天内，退款';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc3_bfb ? json[dayClassName[j]].hotel_cancelzc3_bfb : "0")+'％，说明：';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc3_info ? json[dayClassName[j]].hotel_cancelzc3_info : "无")+'</span></div>';

  		valueHTML += '<div><span style="width:100%;">4：'+(json[dayClassName[j]].hotel_cancelzc4_day ? json[dayClassName[j]].hotel_cancelzc4_day : "-1")+'天内，退款';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc4_bfb ? json[dayClassName[j]].hotel_cancelzc4_bfb : "0")+'％，说明：';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc4_info ? json[dayClassName[j]].hotel_cancelzc4_info : "无")+'</span></div>';

  		valueHTML += '<div><span style="width:100%;">5：'+(json[dayClassName[j]].hotel_cancelzc5_day ? json[dayClassName[j]].hotel_cancelzc5_day : "-1")+'天内，退款';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc5_bfb ? json[dayClassName[j]].hotel_cancelzc5_bfb : "0")+'％，说明：';
  		valueHTML += ''+(json[dayClassName[j]].hotel_cancelzc5_info ? json[dayClassName[j]].hotel_cancelzc5_info : "无")+'</span></div>';
  		valueHTML += '</div></div>';
				}
				tr_html+='<td style="width:300px;">'+valueHTML+'</td>';
			}
			else if(j==3 || j==7)
			{
				var name = '付款';
			  	if(dayClassName[j] == "book_number") name = "预订号";
				valueHTML = '<div style="margin-left:6px;margin-top:2px;"><div><span style="width:100%;"><span class="class_name">'+name+'：</span>'+(json[dayClassName[j]].textarea_base ? json[dayClassName[j]].textarea_base : "")+'</span></div>';
  				valueHTML += '</div>';
				tr_html+='<td style="width:200px;">'+valueHTML+'</td>';
			}
			else if(j==8 || j==9 || j==10)
			{
				var name = "";
  				if(dayClassName[j] == "bus_company") name = "车公司";
  				else if(dayClassName[j] == "bus_use_time") name = "用车时间";
  				else if(dayClassName[j] == "driver") name = "司机"
				valueHTML = '<div style="margin-left:6px;margin-top:2px;"><div><span style="width:100%;"><span class="class_name">'+name+'：</span>'+(json[dayClassName[j]].simple_base ? json[dayClassName[j]].simple_base : "")+'" /></span></div>';
  				valueHTML += '</div>';

				tr_html+='<td';
				if(j==7) tr_html+=' style="width:110px;">';
				else if(j==9) tr_html+=' style="width:80px;">';
				else tr_html+= '>';
				tr_html+=''+valueHTML+'</td>';
			}
			else if(j==11)
			{
				if(json[dayClassName[j]])
				{
					valueHTML = '<div style="margin-left:6px;margin-top:2px;">';
  		valueHTML += '<div><span style="margin-left:10px;width:95%;height:30px;">L午餐：'+(json[dayClassName[j]].lunch_base ? json[dayClassName[j]].lunch_base : "")+'</span></div>';
  		valueHTML += '<div><spanstyle="margin-left:10px;width:95%;">午餐注释：'+(json[dayClassName[j]].lunch_info ? json[dayClassName[j]].lunch_info : "")+'</span></div>';
  		valueHTML += '<div><span style="margin-left:10px;width:95%;height:30px;">D晚餐：'+(json.dinner_base ? json[dayClassName[j]].dinner_base : "")+'</span></div>';
  		valueHTML += '<div><spanstyle="margin-left:10px;width:95%;">晚餐注释：'+(json[dayClassName[j]].dinner_info ? json[dayClassName[j]].dinner_info : "")+'</span></div>';
  		valueHTML += '</div>';
				}
				tr_html+='<td>'+valueHTML+'</td>';
			}
			else if(j==12)
			{
				if(json[dayClassName[j]])
				{
					valueHTML = '<div class="jingdian_fixed" style="background-color:rgba(238, 238, 238, 0.8);width:'+(w-18)+'px;position:fixed;z-index:3;margin-bottom:5px;line-height: 22px;"><label style="margin-left:6px;font-size:18px;">景点门票信息</label></div><div style="margin-left:6px;margin-top:25px;"><div style="margin-left:6px;">';
  		valueHTML +='<div><span style="margin-left:10px;width:95%;height:30px;">1、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian1_base" value="'+(json.jingdian1_base ? json.jingdian1_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		valueHTML +='<div>活动时间：<div style="margin-left:8px;">';
  		valueHTML +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian1_xq_hdsj_start" value="'+(json.jingdian1_xq_hdsj_start ? json.jingdian1_xq_hdsj_start : "")+'" /></div>';
  		valueHTML +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian1_xq_hdsj_end" value="'+(json.jingdian1_xq_hdsj_end ? json.jingdian1_xq_hdsj_end : "")+'" /></div></div></div>';
  		valueHTML +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian1_xq_zwfksj" value="'+(json.jingdian1_xq_zwfksj ? json.jingdian1_xq_zwfksj : "")+'" /></div>';
  		valueHTML +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian1_xq_price" value="'+(json.jingdian1_xq_price ? json.jingdian1_xq_price.replace(/"/g,'&quot;') : "")+'" />';
  		var r = '';
  		if(json.jingdian1_xq_price)
  		{
  			var expression = getExpression(json.jingdian1_xq_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		valueHTML +='<span style="width:15%">='+r+'</span></div>';
  		valueHTML +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian1_xq_ydh" value="'+(json.jingdian1_xq_ydh ? json.jingdian1_xq_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		valueHTML +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian1_xq_jsqk" value="'+(json.jingdian1_xq_jsqk ? json.jingdian1_xq_jsqk.replace(/"/g,'&quot;') : "")+'" /></div>';
  		valueHTML +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian1_xq_other">'+(json.jingdian1_xq_other ? json.jingdian1_xq_other : "")+'</textarea></div>';
  		//info_html +='</div></div>';

  		info_html +='<div><span>2、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian2_base" value="'+(json.jingdian2_base ? json.jingdian2_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		//info_html +='<div><span>景点2详情：<textarea style="margin-left:10px;width:95%;height:'+(h-150)+'px;" placeholder="景点2详情" class="jingdian2_xq">'+(json.jingdian2_xq ? json.jingdian2_xq : "")+'</textarea></span></div>';
  		//info_html +='<div>详情：<div style="margin-left:13px;">';
  		//info_html +='<div>活动时间：<textarea style="margin-left:10px;width:95%;height:'+((h-190)>100 ?(h-190):100)+'px;" placeholder="活动时间" class="jingdian2_xq_hdsj">'+(json.jingdian2_xq_hdsj ? json.jingdian2_xq_hdsj : "")+'</textarea></div>';
  		info_html +='<div>活动时间：<div style="margin-left:8px;">';
  		info_html +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian2_xq_hdsj_end" value="'+(json.jingdian2_xq_hdsj_start ? json.jingdian2_xq_hdsj_start : "")+'" /></div>';
  		info_html +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian2_xq_hdsj_end" value="'+(json.jingdian2_xq_hdsj_end ? json.jingdian2_xq_hdsj_end : "")+'" /></div></div></div>';
  		info_html +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian2_xq_zwfksj" value="'+(json.jingdian2_xq_zwfksj ? json.jingdian2_xq_zwfksj : "")+'" /></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian2_xq_price" value="'+(json.jingdian2_xq_price ? json.jingdian2_xq_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.jingdian2_xq_price)
  		{
  			var expression = getExpression(json.jingdian2_xq_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian2_xq_ydh" value="'+(json.jingdian2_xq_ydh ? json.jingdian2_xq_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian2_xq_jsqk" value="'+(json.jingdian2_xq_jsqk ? json.jingdian2_xq_jsqk.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian2_xq_other">'+(json.jingdian2_xq_other ? json.jingdian2_xq_other : "")+'</textarea></div>';
  		//info_html +='</div></div>';

  		info_html +='<div><span>3、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian3_base" value="'+(json.jingdian3_base ? json.jingdian3_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		//info_html +='<div><span>景点3详情：<textarea style="margin-left:10px;width:95%;height:'+(h-150)+'px;" placeholder="景点3详情" class="jingdian3_xq">'+(json.jingdian3_xq ? json.jingdian3_xq : "")+'</textarea></span></div>';
  		//info_html +='<div>详情：<div style="margin-left:13px;">';
  		//info_html +='<div>活动时间：<textarea style="margin-left:10px;width:95%;height:'+((h-190)>100 ?(h-190):100)+'px;" placeholder="活动时间" class="jingdian3_xq_hdsj">'+(json.jingdian3_xq_hdsj ? json.jingdian3_xq_hdsj : "")+'</textarea></div>';
  		info_html +='<div>活动时间：<div style="margin-left:8px;">';
  		info_html +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian3_xq_hdsj_end" value="'+(json.jingdian3_xq_hdsj_start ? json.jingdian3_xq_hdsj_start : "")+'" /></div>';
  		info_html +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian3_xq_hdsj_end" value="'+(json.jingdian3_xq_hdsj_end ? json.jingdian3_xq_hdsj_end : "")+'" /></div></div></div>';
  		info_html +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian3_xq_zwfksj" value="'+(json.jingdian3_xq_zwfksj ? json.jingdian3_xq_zwfksj : "")+'" /></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian3_xq_price" value="'+(json.jingdian3_xq_price ? json.jingdian3_xq_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.jingdian3_xq_price)
  		{
  			var expression = getExpression(json.jingdian3_xq_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian3_xq_ydh" value="'+(json.jingdian3_xq_ydh ? json.jingdian3_xq_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian3_xq_jsqk" value="'+(json.jingdian3_xq_jsqk ? json.jingdian3_xq_jsqk.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian3_xq_other">'+(json.jingdian3_xq_other ? json.jingdian3_xq_other : "")+'</textarea></div>';
  		//info_html +='</div></div>';

  		info_html +='<div><span>4、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian4_base" value="'+(json.jingdian4_base ? json.jingdian4_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		//info_html +='<div><span>景点4详情：<textarea style="margin-left:10px;width:95%;height:'+(h-150)+'px;" placeholder="景点4详情" class="jingdian4_xq">'+(json.jingdian4_xq ? json.jingdian4_xq : "")+'</textarea></span></div>';
  		//info_html +='<div>详情：<div style="margin-left:13px;">';
  		//info_html +='<div>活动时间：<textarea style="margin-left:10px;width:95%;height:'+((h-190)>100 ?(h-190):100)+'px;" placeholder="活动时间" class="jingdian4_xq_hdsj">'+(json.jingdian4_xq_hdsj ? json.jingdian4_xq_hdsj : "")+'</textarea></div>';
  		info_html +='<div>活动时间：<div style="margin-left:8px;">';
  		info_html +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian4_xq_hdsj_end" value="'+(json.jingdian4_xq_hdsj_start ? json.jingdian4_xq_hdsj_start : "")+'" /></div>';
  		info_html +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian4_xq_hdsj_end" value="'+(json.jingdian4_xq_hdsj_end ? json.jingdian4_xq_hdsj_end : "")+'" /></div></div></div>';
  		info_html +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian4_xq_zwfksj" value="'+(json.jingdian4_xq_zwfksj ? json.jingdian4_xq_zwfksj : "")+'" /></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian4_xq_price" value="'+(json.jingdian4_xq_price ? json.jingdian4_xq_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.jingdian4_xq_price)
  		{
  			var expression = getExpression(json.jingdian4_xq_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian4_xq_ydh" value="'+(json.jingdian4_xq_ydh ? json.jingdian4_xq_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian4_xq_jsqk" value="'+(json.jingdian4_xq_jsqk ? json.jingdian4_xq_jsqk.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian4_xq_other">'+(json.jingdian4_xq_other ? json.jingdian4_xq_other : "")+'</textarea></div>';
  		//info_html +='</div></div>';

  		info_html +='<div><span>5、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian5_base" value="'+(json.jingdian5_base ? json.jingdian5_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		//info_html +='<div><span>景点5详情：<textarea style="margin-left:10px;width:95%;height:'+(h-150)+'px;" placeholder="景点5详情" class="jingdian5_xq">'+(json.jingdian5_xq ? json.jingdian5_xq : "")+'</textarea></span></div>';
  		//info_html +='<div>详情：<div style="margin-left:13px;">';
  		//info_html +='<div>活动时间：<textarea style="margin-left:10px;width:95%;height:'+((h-190)>100 ?(h-190):100)+'px;" placeholder="活动时间" class="jingdian5_xq_hdsj">'+(json.jingdian5_xq_hdsj ? json.jingdian5_xq_hdsj : "")+'</textarea></div>';
  		info_html +='<div>活动时间：<div style="margin-left:8px;">';
  		info_html +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian5_xq_hdsj_end" value="'+(json.jingdian5_xq_hdsj_start ? json.jingdian5_xq_hdsj_start : "")+'" /></div>';
  		info_html +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian5_xq_hdsj_end" value="'+(json.jingdian5_xq_hdsj_end ? json.jingdian5_xq_hdsj_end : "")+'" /></div></div></div>';
  		info_html +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian5_xq_zwfksj" value="'+(json.jingdian5_xq_zwfksj ? json.jingdian5_xq_zwfksj : "")+'" /></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian5_xq_price" value="'+(json.jingdian5_xq_price ? json.jingdian5_xq_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.jingdian5_xq_price)
  		{
  			var expression = getExpression(json.jingdian5_xq_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian5_xq_ydh" value="'+(json.jingdian5_xq_ydh ? json.jingdian5_xq_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian5_xq_jsqk" value="'+(json.jingdian5_xq_jsqk ? json.jingdian5_xq_jsqk.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian5_xq_other">'+(json.jingdian5_xq_other ? json.jingdian5_xq_other : "")+'</textarea></div>';
  		//info_html +='</div></div>';
  		info_html +='</div></div>';
				}
				tr_html+='<td>'+valueHTML+'</td>';
			}
			else if(j==13)
			{
				if(json[dayClassName[j]]&&(json[dayClassName[j]].hb_arrive1_base_hbh||json[dayClassName[j]].hb_arrive2_base_hbh||json[dayClassName[j]].hb_arrive3_base_hbh||json[dayClassName[j]].hb_arrive4_base_hbh||json[dayClassName[j]].hb_arrive5_base_hbh))
				{
					var hb_index = 0;
					if(json[dayClassName[j]].hb_arrive1_base_hbh) hb_index = 1;
					else if(json[dayClassName[j]].hb_arrive2_base_hbh) hb_index = 2;
					else if(json[dayClassName[j]].hb_arrive3_base_hbh) hb_index = 3;
					else if(json[dayClassName[j]].hb_arrive4_base_hbh) hb_index = 4;
					else if(json[dayClassName[j]].hb_arrive5_base_hbh) hb_index = 5;
					value = '抵达：'+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_hbh'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_date']) value += ' '+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_date'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_code']) value += ' '+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_code'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_qfsj']) value += ' '+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_qfsj'];
					if(json[dayClassName[j]]['hb_arrive'+hb_index+'_base_ddsj']) value += '/'+json[dayClassName[j]]['hb_arrive'+hb_index+'_base_ddsj'];
					for(var k=1;k<=5;k++)
					{
						if(k==hb_index) continue;
						var key = 'hb_arrive'+k+'_base';
						var v ='';
						if(json[dayClassName[j]][key+'_hbh'])
						{
							v = json[dayClassName[j]][key+'_hbh'];
							if(json[dayClassName[j]][key+'_date']) v += ' '+json[dayClassName[j]][key+'_date'];
							if(json[dayClassName[j]][key+'_code']) v += ' '+json[dayClassName[j]][key+'_code'];
							if(json[dayClassName[j]][key+'_qfsj']) v += ' '+json[dayClassName[j]][key+'_qfsj'];
							if(json[dayClassName[j]][key+'_ddsj']) v += '/'+json[dayClassName[j]][key+'_ddsj'];
						}
						if(v.length>0) value += '、'+v;

					}
				}
				if(json[dayClassName[j]]&&(json[dayClassName[j]].hb_leave1_base_hbh||json[dayClassName[j]].hb_leave2_base_hbh||json[dayClassName[j]].hb_leave3_base_hbh||json[dayClassName[j]].hb_leave4_base_hbh||json[dayClassName[j]].hb_leave5_base_hbh))
				{
					var hb_index = 0;
					if(json[dayClassName[j]].hb_leave1_base_hbh) hb_index = 1;
					else if(json[dayClassName[j]].hb_leave2_base_hbh) hb_index = 2;
					else if(json[dayClassName[j]].hb_leave3_base_hbh) hb_index = 3;
					else if(json[dayClassName[j]].hb_leave4_base_hbh) hb_index = 4;
					else if(json[dayClassName[j]].hb_leave5_base_hbh) hb_index = 5;
					if(value.length>0) value += '；离开：'+json[dayClassName[j]]['hb_leave'+hb_index+'_base_hbh'];
					else value = '离开：'+json[dayClassName[j]]['hb_leave'+hb_index+'_base_hbh'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_date']) value += ' '+json[dayClassName[j]]['hb_leave'+hb_index+'_base_date'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_code']) value += ' '+json[dayClassName[j]]['hb_leave'+hb_index+'_base_code'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_qfsj']) value += ' '+json[dayClassName[j]]['hb_leave'+hb_index+'_base_qfsj'];
					if(json[dayClassName[j]]['hb_leave'+hb_index+'_base_ddsj']) value += '/'+json[dayClassName[j]]['hb_leave'+hb_index+'_base_ddsj'];
					for(var k=1;k<=5;k++)
					{
						if(k==hb_index) continue;
						var key = 'hb_leave'+k+'_base';
						var v ='';
						if(json[dayClassName[j]][key+'_hbh'])
						{
							v = json[dayClassName[j]][key+'_hbh'];
							if(json[dayClassName[j]][key+'_date']) v += ' '+json[dayClassName[j]][key+'_date'];
							if(json[dayClassName[j]][key+'_code']) v += ' '+json[dayClassName[j]][key+'_code'];
							if(json[dayClassName[j]][key+'_qfsj']) v += ' '+json[dayClassName[j]][key+'_qfsj'];
							if(json[dayClassName[j]][key+'_ddsj']) v += '/'+json[dayClassName[j]][key+'_ddsj'];
						}
						if(v.length>0) value += '、'+v;
					}
				}
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showAirPortDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else
			{
				if(j==1) continue;
				tr_html+='<td style="width:';
				if(j==1) tr_html+='60px;">';
				else tr_html+='36px;">';
				tr_html+='<span style="width:100%;border:0px;height:25px;">'+(json[dayClassName[j]] ? json[dayClassName[j]] : "")+'</span></td>';
			}
		}
		tr_html += '</tr>';
	return tr_html;
  }
  function printTable(content)
  {
  	var printHTML = '<div class="fixed-table-container-inner" style="height:auto;">';
	printHTML+='<table cellspacing="0"><thead><tr class="complex-top"><th class="third" rowspan="2"><div class="th-inner" style="width:20px;">星期</div></th><th class="third" rowspan="2"><div class="th-inner">日期</div></th><th class="third" rowspan="2"><div class="th-inner">导游</div>';
	printHTML+='</th><th class="second" colspan="5"><div class="th-inner" >酒店</div></th><th class="third" rowspan="2"><div class="th-inner">预定号</div>';
	printHTML+='</th><th class="third" rowspan="2"><div class="th-inner">车公司</div></th><th class="third" rowspan="2"><div class="th-inner">用车时间</div></th><th class="third" rowspan="2"><div class="th-inner">司机</div>';
	printHTML+='</th><th class="third" rowspan="2"><div class="th-inner">用餐</div></th><th class="third" rowspan="2"><div class="th-inner">景点门票</div></th><th class="third" rowspan="2"><div class="th-inner">抵达／离开时间</div>';
	printHTML+='</th></tr><tr class="complex-bottom"><th class="second"><div class="th-inner">酒店名</div></th><th class="second"><div class="th-inner">付款</div></th><th class="second"><div class="th-inner">双</div>';
	printHTML+='</th><th class="second"><div class="th-inner">单</div></th><th class="second"><div class="th-inner">司导</div></th></tr></thead><tbody class="print_content">';

	var tbody_html ='';
  	for(var index in content)
    {
        var single = contents[index];
        //if(single.ext.name)
        {
        	var info = single.ext;
        	tbody_html +='<tr>';
        	tbody_html +='<td colspan="15"><span style="width:100%;">项目名称：'+(info.name ? info.name : "")+'</span></td>';
        	tbody_html +='</tr>';
        	tbody_html +='<tr><td colspan="15"><span style="width:100%;">组团单位：'+(info.ztdanwei ? info.ztdanwei : "")+'</span></td></tr>';
        	tbody_html +='<tr><td colspan="15"><span style="width:100%;">团号：'+(info.zttuanhao ? info.zttuanhao : "")+'</span></td></tr>';
        	tbody_html +='<tr><td colspan="15"><span style="width:40%;">大人人数：'+(info.adult_number ? info.adult_number : "")+'</span>';
        	tbody_html +='<span style="width:40%;">儿童人数：'+(info.children_number ? info.children_number : "")+'</span></td></tr>';
        	tbody_html +='<tr><td colspan="15"><span style="width:40%;">开始日期：'+(info.startdate ? info.startdate : "")+'</span>';
        	tbody_html +='<span style="width:40%;">结束日期：'+(info.enddate ? info.enddate : "")+'</span></td></tr>';

        	if(info.days)
        	{
        		var days = info.days;
        		var qstartdate = new Date(info.startdate);
  				var qenddate = new Date(info.enddate);
  				var time = qenddate.getTime() - qstartdate.getTime();
  				length = time/1000/3600/24;
  				var firstDate = new Date(info.startdate);
        		//if(days['1'])
        		{
        			var day_length = 0;
        			for(var key in days)
        			{
        				var td = days[key];
        				var tdDate = new Date(dateformat(td.date));
        				if(tdDate.getTime() > firstDate.getTime())
        				{
        					var tdDay = (tdDate.getTime() - firstDate.getTime())/1000/3600/24;
        					var tr_html = printTrHtml(firstDate,day_length,day_length+tdDay-1,single._id);
  							tbody_html += tr_html;
  							day_length += tdDay;

  							tr_html = printTrHTMLByJSON(td,single._id,key);
        					tbody_html += tr_html;
        					day_length += 1;
        					firstDate.setDate(firstDate.getDate()+1);
        				}
        				else
        				{
        					var tr_html = trHTMLByJSON(td,single._id,key);
        					tbody_html += tr_html;
        					day_length += 1;
        					firstDate.setDate(firstDate.getDate()+1);
        				}
        				if(day_length > length)
        				{
        					break;
        				}
        			}
        			if(day_length < (length+1))
        			{
        				qstartdate.setDate(qstartdate.getDate()+day_length);
        				var tr_html = printTrHtml(qstartdate,day_length,length,single._id);
  						tbody_html += tr_html;
        			}
        		}
        	}
        }
    }
	printHTML+="</tbody></table></div>";
  }
  window.printTable = printTable;//*/
  $("#end-date").on('change',function(e){
  	var endValue = $(e.target).val();
  	var startValue = $("#start-date").val();
  	if(startValue && startValue.length>0)
  	{
  		var startDate = new Date(startValue);
  		var endDate = new Date(endValue);
  		var time = endDate.getTime() - startDate.getTime();
  		console.log(time/1000/3600/24);
  		if( time<= 0)
  		{
  			alert('结束日期要大于开始日期');
  		}
  		else
  		{
  			length = time/1000/3600/24;
  			tr = $(e.target).parent().parent().parent();
  			trs = $(tr).siblings("tr.day");
  			if(trs && trs.length>0)
  			{
  				first = new Date(dateformat($($(trs[0]).children('td')[1]).text()));
  				end = new Date(dateformat($($(trs[trs.length-1]).children('td')[1]).text()));
  				if(endDate.getTime() - first.getTime() <= 0)
  				{
  					if(confirm('你所选择的结束日期在表中的最小日期之前，这样会造成之前的所有数据被清除！'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()>endDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						isEqual = endDate.getTime() - first.getTime();
  						if(isEqual == 0) length -= 1;
  						var tr_html = trHtml(startDate,0,length);
  						if(isEqual == 0) $(tr).next().before(tr_html);
  						else $(tr).after(tr_html);
  					}
  					else
  					{
  						$(e.target).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#start-date").val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() - end.getTime() >= 0)
  				{
  					if(confirm('你所选择的开始日期在表中的最大日期之后，这样会造成之前的所有数据被清除！'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()<startDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						isEqual = startDate.getTime() - end.getTime();
  						if(isEqual == 0) startDate.setDate(startDate.getDate()+1);
  						var tr_html = trHtml(startDate,0,length);
  						if(isEqual == 0) $(tr).next().after(tr_html);
  						else $(tr).after(tr_html);
  					}
  					else
  					{
  						$(e.target).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#start-date").val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() > first.getTime() && endDate.getTime() < end.getTime())
  				{
  					if(confirm('你所选择的日期在表中的日期的中间，这样会造成表中上下两端的有些数据被清除！'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()<startDate.getTime() || t.getTime()>endDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  					}
  					else
  					{
  						$(e.target).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#start-date").val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() <= first.getTime() && endDate.getTime() <= end.getTime())
  				{
  					if(confirm('你所选择的日期会把表中的下端有些数据被清除！上端有可能添加行'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()>endDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						l = (first.getTime() - startDate.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							var h = trHtml(startDate,0,l)
  							$(trs[0]).before(h);
  						}
  					}
  					else
  					{
  						$(e.target).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#start-date").val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() >= first.getTime() && endDate.getTime() >= end.getTime())
  				{
  					if(confirm('你所选择的日期会把表中的上端有些数据被清除！下端有可能添加行'))
  					{
  						for(var i=0;i<trs.length;i++)
  						{
  							t = new Date(dateformat($($(trs[i]).children('td')[1]).text()));
  							if(t.getTime()<startDate.getTime())
  							{
  								$(trs[i]).remove();
  							}
  						}
  						l = (endDate.getTime() - end.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							end.setDate(end.getDate()+1)
  							var h = trHtml(end,0,l)
  							$(trs[trs.length-1]).after(h);
  						}
  					}
  					else
  					{
  						$(e.target).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#start-date").val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  				else if(startDate.getTime() < first.getTime() && endDate.getTime() > end.getTime())
  				{
  					if(confirm('你所选择的日期会在表中的上下两端添加行'))
  					{
  						l = (first.getTime() - startDate.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							var h = trHtml(startDate,0,l-1)
  							$(trs[0]).before(h);
  						}
  						l = (endDate.getTime() - end.getTime())/1000/3600/24;
  						if(l>0)
  						{
  							end.setDate(end.getDate()+1)
  							var h = trHtml(end,0,l-1)
  							$(trs[trs.length-1]).after(h);
  						}
  					}
  					else
  					{
  						$(e.target).val(end.getFullYear()+'-'+ (end.getMonth()+1 < 10 ? '0'+(end.getMonth()+1) : end.getMonth()+1)+'-'+(end.getDate() < 10 ? '0'+end.getDate() : end.getDate()));
  						$("#start-date").val(first.getFullYear()+'-'+ (first.getMonth()+1 < 10 ? ('0'+(first.getMonth()+1)) : (first.getMonth()+1))+'-'+(first.getDate() < 10 ? ('0'+first.getDate()) : (first.getDate())));
  					}
  				}
  			}
  			else
  			{
  				var tr_html = trHtml(startDate,0,length);
  				/*for(var i=0;i<=length;i++)
  				{
  					tr_html+='<tr class="day">';
  					w = startDate.getDay();
  					month = startDate.getMonth()+1;
  					if(month>12) month = 1;
  					if(w == 0 || w==5 || w==6)
  					{
  						tr_html +='<td><span style="color:red;">';
  					}
  					else
  					{
  						tr_html +='<td><span>';
  					}
  					day = startDate.getDate();
  					if(day<10) day = '0'+day;
  					tr_html +=weekDays[w]+'</span></td><td>'+month+'/'+day+'/'+startDate.getFullYear()+'</td>'
  					for(var j=0;j<14;j++)
  					{
  						tr_html+='<td><input style="width:100%;border:0px;height:25px;" /></td>';
  					}
  					tr_html += '</tr>';
  					startDate.setDate(startDate.getDate()+1);
  				}//*/
  				$(tr).after(tr_html);
  			}
  		}
  	}
  });
}
