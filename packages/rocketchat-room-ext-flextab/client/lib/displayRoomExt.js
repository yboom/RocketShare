window.displayRoomExt=function(ext,showTitle)
{
	var rooms = ext;
	var isTitle = showTitle;
  	var weekDays = ["日","一","二","三","四","五","六"];
  	var dayClassName = ["tuanhao","people","hotel_name","hotel_fukuan","hotel_double","hotel_single","hotel_sidao","book_number","bus_company","bus_use_time","driver","dinner","jingdian","airport"];
	var cal = "+-*/().%＋－＊／（）％";
	var th_cal = ["th_gongzi","th_fee","th_cfbz","th_df"];
	var hb_arrive = true;
	var msgQueue = [];
	var currentShowDiv = null;
	var width = window.innerWidth || document.documentElement.clientWidth ||
    document.body.clientWidth;
  	var height = window.innerHeight || document.documentElement.clientHeight ||
    document.body.clientHeight;
    var show = null;
  function cancelDiv(e)
  {
  	$(e).parent().parent().hide();
  	show = null;
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
  		value = value.replace('{"','');
  		value = value.replace('"}','');
  		msg = '';
  		if(!r.ext.days || !r.ext.days[day])
  		{
  			var tr = $(show).parent().parent();
  			var span = $(tr).find('span');
  			if(!span || !span.length) return;
  			var week = $(span[0]).text();
  			var date = $(span[1]).text();
  			msg = ':=[{"$set": {"ext.days.'+day+'.week":"'+week+'","ext.days.'+day+'.date":"'+date+'","ext.days.'+day+'.'+className+'":{"'+value+'"}}}]';
  		}
  		else
  		{
  			msg = ':=[{"$set": {"ext.days.'+day+'.'+className+'":{"'+value+'"}}}]';
  		}
  		//console.log(msg);
  		//console.log(JSON.parse(msg.replace(':=','')));
  		//console.log(r.ext.days[day]);
  		sendMessage(rid,msg);
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
  	}
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
  			if(!isNaN(r))
  			{
  				//$(t).val(string+'='+r);
  				var span = $(t).parent().next();
  				if(span&&span.length>0)
  				{
  					$(span).text('='+r);
  				}
  			}
  		}
  		var div = $(t).parent().parent().parent();
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
  				if(!isNaN(total_result))
  					$(total).val(total_result);
  			}
  		}
  	}
  }
  window.computeResult = computeResult;
  function showDiv(e)
  {
  	$(".tablesimple").hide();
  	$(".tablehotel").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
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
  	//if(isTitle) top = top + 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
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
  	  				computeResult($("."+key));
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
  	}
  	else
  	{//onPropertyChange="window.computeResult(this)" 
  		div = document.createElement("div");
  		div.setAttribute("class","tablecontainer");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;"><div><span>姓名：<input style="width:75%;" placeholder="姓名" class="th_base_name" value="'+(json.th_base_name ? json.th_base_name.replace(/"/g,'&quot;') : "")+'" /></span></div>';
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
  		
  		info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.th_base_name')[0]).focus();
  	show = e;
  	currentShowDiv = div;
  }
  window.showDiv = showDiv;
  function showHotelDiv(e)
  {
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
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
  	//if(isTitle) top = top + 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	if(json.hotel_base_xc)
  	  	{
  	  		for(var key in json)
  	  		{
  	  			if(json[key].length>0) 
  	  			{
  	  				$("."+key).val(json[key]);
  	  				//if($("."+key).is('input')) $("."+key).val(json[key].replace(/"/g,'&quot;'));
  	  			}
  	  			else $("."+key).val('');
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
  		div.setAttribute("class","tablehotel");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;"><div><span>行程：<input style="width:96.5%;" placeholder="行程" class="hotel_base_xc" value="'+(json.hotel_base_xc ? json.hotel_base_xc.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>酒店名：<input style="width:96.5%;" placeholder="酒店名" class="hotel_base_dm" value="'+(json.hotel_base_dm ? json.hotel_base_dm.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>星级：<input style="width:96.5%;" placeholder="星级" class="hotel_xingji" value="'+(json.hotel_xingji ? json.hotel_xingji.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>地址：<input style="width:96.5%;" placeholder="地址" class="hotel_address" value="'+(json.hotel_address ? json.hotel_address.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '<div><span>报价：<textarea style="margin-left:10px;width:95%;height:120px;" placeholder="报价信息" class="hotel_baojie">'+(json.hotel_baojie ? json.hotel_baojie : "")+'</textarea></span></div>';
  		//info_html += '<div><span>取消政策：<textarea style="margin-left:10px;width:95%;height:50px;" placeholder="取消政策" class="hotel_cancel">'+(json.hotel_cancel ? json.hotel_cancel : "")+'</textarea></span></div>';
  		//info_html += '<div><span>付款情况：<textarea style="margin-left:10px;width:95%;height:50px;" placeholder="付款情况" class="hotel_fukuan"></textarea></span></div>';
  		info_html += '<div>取消政策：<div style="margin-left:15px;">';
  		info_html += '<div><span>1：<input style="width:25%;" placeholder="天数" class="hotel_cancelzc1_day" value="'+(json.hotel_cancelzc1_day ? json.hotel_cancelzc1_day : "")+'" />天内，退款';
  		info_html += '<input style="width:25%;" placeholder="数字" class="hotel_cancelzc1_bfb" value="'+(json.hotel_cancelzc1_bfb ? json.hotel_cancelzc1_bfb : "")+'" />％，说明：';
  		info_html += '<input style="width:98%;" placeholder="说明" class="hotel_cancelzc1_info" value="'+(json.hotel_cancelzc1_info ? json.hotel_cancelzc1_info.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		
  		info_html += '<div><span>2：<input style="width:25%;" placeholder="天数" class="hotel_cancelzc2_day" value="'+(json.hotel_cancelzc2_day ? json.hotel_cancelzc2_day : "")+'" />天内，退款';
  		info_html += '<input style="width:25%;" placeholder="数字" class="hotel_cancelzc2_bfb" value="'+(json.hotel_cancelzc2_bfb ? json.hotel_cancelzc2_bfb : "")+'" />％，说明：';
  		info_html += '<input style="width:98%;" placeholder="说明" class="hotel_cancelzc2_info" value="'+(json.hotel_cancelzc2_info ? json.hotel_cancelzc2_info.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		
  		info_html += '<div><span>3：<input style="width:25%;" placeholder="天数" class="hotel_cancelzc3_day" value="'+(json.hotel_cancelzc3_day ? json.hotel_cancelzc3_day : "")+'" />天内，退款';
  		info_html += '<input style="width:25%;" placeholder="数字" class="hotel_cancelzc3_bfb" value="'+(json.hotel_cancelzc3_bfb ? json.hotel_cancelzc3_bfb : "")+'" />％，说明：';
  		info_html += '<input style="width:98%;" placeholder="说明" class="hotel_cancelzc3_info" value="'+(json.hotel_cancelzc3_info ? json.hotel_cancelzc3_info.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		
  		info_html += '<div><span>4：<input style="width:25%;" placeholder="天数" class="hotel_cancelzc4_day" value="'+(json.hotel_cancelzc4_day ? json.hotel_cancelzc4_day : "")+'" />天内，退款';
  		info_html += '<input style="width:25%;" placeholder="数字" class="hotel_cancelzc4_bfb" value="'+(json.hotel_cancelzc4_bfb ? json.hotel_cancelzc4_bfb : "")+'" />％，说明：';
  		info_html += '<input style="width:98%;" placeholder="说明" class="hotel_cancelzc4_info" value="'+(json.hotel_cancelzc4_info ? json.hotel_cancelzc4_info.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		
  		info_html += '<div><span>5：<input style="width:25%;" placeholder="天数" class="hotel_cancelzc5_day" value="'+(json.hotel_cancelzc5_day ? json.hotel_cancelzc5_day : "")+'" />天内，退款';
  		info_html += '<input style="width:25%;" placeholder="数字" class="hotel_cancelzc5_bfb" value="'+(json.hotel_cancelzc5_bfb ? json.hotel_cancelzc5_bfb : "")+'" />％，说明：';
  		info_html += '<input style="width:98%;" placeholder="说明" class="hotel_cancelzc5_info" value="'+(json.hotel_cancelzc5_info ? json.hotel_cancelzc5_info.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		info_html += '</div></div>';
  		info_html += '</div>';
  		
  		info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.hotel_base_xc')[0]).focus();
  	show = e;
  	currentShowDiv = div;
  }
  window.showHotelDiv = showHotelDiv;
  function showTextAreaDiv(e)
  {
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tablesimple").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tabledinner").hide();
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
  	//if(isTitle) top = top + 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
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
  	show = e;
  	currentShowDiv = div;
  }
  window.showTextAreaDiv = showTextAreaDiv;
  function showSimpleDiv(e)
  {
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tabledinner").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
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
  	var div = $(".tablesimple");
  	var name = "预订号";
  	if($(e).attr("class") == "bus_company") name = "车公司";
  	else if($(e).attr("class") == "bus_use_time") name = "用车时间";
  	else if($(e).attr("class") == "driver") name = "司机"
  	
  	var top = $(e).position().top+$(e).height()+23;
  	//if(isTitle) top = top + 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = 90;//height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
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
  	show = e;
  	currentShowDiv = div;
  }
  window.showSimpleDiv = showSimpleDiv;
  function showDinnerDiv(e)//用餐
  {
  	$(".tablecontainer").hide();
  	$(".tablehotel").hide();
  	$(".tablesimple").hide();
  	$(".tableairport").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
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
  	var div = $(".tabledinner");
  	
  	var top = $(e).position().top+$(e).height()+23;
  	//if(isTitle) top = top + 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = height/3+5-90;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
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
  	  			}
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
  		div.setAttribute("class","tabledinner");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div style="margin-left:6px;margin-top:2px;">';//'<div><span>B早餐：<input style="margin-left:10px;width:95%;height:30px;" placeholder="早餐" value="'+(json.breakfast_base ? json.breakfast_base : "")+'" class="breakfast_base" /></span></div>';
  		//info_html += '<div><span>早餐详情：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="早餐注释" class="breakfast_info">'+(json.breakfast_info ? json.breakfast_info : "")+'</textarea></span></div>';
  		info_html += '<div><span>L午餐：<input style="margin-left:10px;width:95%;height:30px;" placeholder="午餐" value="'+(json.lunch_base ? json.lunch_base.replace(/"/g,'&quot;') : "")+'" class="lunch_base" /></span></div>';
  		info_html += '<div><span>午餐注释：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="午餐注释" class="lunch_info">'+(json.lunch_info ? json.lunch_info : "")+'</textarea></span></div>';
  		info_html += '<div><span>D晚餐：<input style="margin-left:10px;width:95%;height:30px;" placeholder="晚餐" value="'+(json.dinner_base ? json.dinner_base.replace(/"/g,'&quot;') : "")+'" class="dinner_base"/></span></div>';
  		info_html += '<div><span>晚餐注释：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="晚餐注释" class="dinner_info">'+(json.dinner_info ? json.dinner_info : "")+'</textarea></span></div>';
  		//info_html += '<div><span>注释：<input style="margin-left:10px;width:95%;height:30px;" placeholder="注释" value="'+(json.lunchdinner_zhushi ? json.lunchdinner_zhushi : "")+'" class="lunchdinner_zhushi"/></span></div>';
  		info_html += '</div>';
  		
  		info_html += '<div style="text-align: center;margin-top:10px;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.lunch_base')[0]).focus();
  	show = e;
  	currentShowDiv = div;
  }
  window.showDinnerDiv = showDinnerDiv;
  function addJingDianDiv(e)
  {
  	
  }
  window.addJingDianDiv = addJingDianDiv;
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
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tablehotel").hide();
  	$(".tableairport").hide();
  	$(".tableTextAreaDiv").hide();
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
  	//if(isTitle) top = top + 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.jingdian_fixed');
  	  	$(div).find('.jingdian_fixed').remove();
  	  	if(json.jingdian1_base)
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
  	  				computeJingDianAndAirPortResult($("."+key));
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
  	}
  	else
  	{
  		div = document.createElement("div");
  		div.setAttribute("class","tablejingdian");
  		$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  		$(div).css({'position':'absolute','z-index': 199999,'display':'block','top':top+'px','left':left+'px','overflow-y':'auto',
  					'background-color':'rgba(238, 238, 238, 0.8)','width':w,'height':h,'border':'1px solid rgba(163, 163, 163, 0.9)','-webkit-border-radius':'8px','border-radius':'8px'});
  		var info_html = '<div class="jingdian_fixed" style="background-color:rgba(238, 238, 238, 0.8);width:'+(w-18)+'px;position:fixed;z-index:3;margin-bottom:5px;line-height: 22px;"><label style="margin-left:6px;font-size:18px;">景点门票信息</label></div><div style="margin-left:6px;margin-top:25px;"><div style="margin-left:6px;">';
  		info_html +='<div><span>1、名称：<input style="margin-left:10px;width:95%;height:30px;" placeholder="名称" class="jingdian1_base" value="'+(json.jingdian1_base ? json.jingdian1_base.replace(/"/g,'&quot;') : "")+'" /></span></div>';
  		//info_html +='<div><span>景点1详情：<textarea style="margin-left:10px;width:95%;height:'+(h-150)+'px;" placeholder="景点1详情" class="jingdian1_xq">'+(json.jingdian1_xq ? json.jingdian1_xq : "")+'</textarea></span></div>';
  		//info_html +='<div>详情：<div style="margin-left:13px;">';
  		//info_html +='<div>活动时间：<textarea style="margin-left:10px;width:95%;height:'+((h-190)>100 ?(h-190):100)+'px;" placeholder="活动时间" class="jingdian1_xq_hdsj">'+(json.jingdian1_xq_hdsj ? json.jingdian1_xq_hdsj : "")+'</textarea></div>';
  		info_html +='<div>活动时间：<div style="margin-left:8px;">';
  		info_html +='<div>开始时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="开始时间" class="jingdian1_xq_hdsj_start" value="'+(json.jingdian1_xq_hdsj_start ? json.jingdian1_xq_hdsj_start : "")+'" /></div>';
  		info_html +='<div>结束时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结束时间" class="jingdian1_xq_hdsj_end" value="'+(json.jingdian1_xq_hdsj_end ? json.jingdian1_xq_hdsj_end : "")+'" /></div></div></div>';
  		info_html +='<div>最晚付款时间:<input style="margin-left:10px;width:95%;height:30px;" placeholder="最晚付款时间" class="jingdian1_xq_zwfksj" value="'+(json.jingdian1_xq_zwfksj ? json.jingdian1_xq_zwfksj : "")+'" /></div>';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="jingdian1_xq_price" value="'+(json.jingdian1_xq_price ? json.jingdian1_xq_price.replace(/"/g,'&quot;') : "")+'" />';
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
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="jingdian1_xq_ydh" value="'+(json.jingdian1_xq_ydh ? json.jingdian1_xq_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>结算情况：<input style="margin-left:10px;width:95%;height:30px;" placeholder="结算情况" class="jingdian1_xq_jsqk" value="'+(json.jingdian1_xq_jsqk ? json.jingdian1_xq_jsqk.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>其他：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="其他信息" class="jingdian1_xq_other">'+(json.jingdian1_xq_other ? json.jingdian1_xq_other : "")+'</textarea></div>';
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
  		
  		info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  		for(var i=1;i<=5;i++)
  		{
  			$($(div).find('.jingdian'+i+'_xq_zwfksj')[0]).datepicker();
  		}
  	}
  	$(div).scrollTop(0);
  	$($(div).find('.jingdian1_base')[0]).focus();
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
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tablehotel").hide();
  	$(".tablejingdian").hide();
  	$(".tableTextAreaDiv").hide();
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
  	//if(divTop == 0 && isTitle) top += 28;
  	var left = $(e).position().left;
  	var w = width/5;
  	var h = height/3+5;
  	var cw = document.body.clientWidth || 0;
  	if(left + w > width) left = left - w;
  	else if(left + w > cw) left = left - w;
  	if(left < 0) left = 0;
  	if(top + h >height) top = $(e).position().top - h+20;
  	if(div && div.length>0)
  	{
  	  	$(div).css({'top':top+'px','left':left+'px'});
  	  	$(div).attr("id",$(e).attr("id"));
  	  	$(div).attr("data-day",$(e).attr("data-day"));
  	  	var fixed = $(div).find('.hb_fixed');
  	  	$(div).find('.hb_fixed').remove();
  	  	if(json.hb_arrive1_base_hbh || json.hb_leave1_base_hbh)
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
  	  				computeJingDianAndAirPortResult($("."+key));
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
  		info_html += '<label style="margin-left:10px;font-size:18px;" class="hb_arrive_div">抵达航班信息</label><label style="margin-left:10px;font-size:18px;display:none;" class="hb_leave_div">离开航班信息</label></div>';
  		info_html += '<div style="margin-left:10px;margin-top:56px;" class="hb_arrive_div"><div style="margin-left:6px;">';
  		//info_html += '<div><span>1、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_arrive1_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_arrive1_base ? json.hb_arrive1_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班1详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_arrive1_info" placeholder="航班1详情">'+(json.hb_arrive1_info ? json.hb_arrive1_info : "")+'</textarea></span></div>';
  		info_html += '<div>1、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_arrive1_base_hbh" value="'+(json.hb_arrive1_base_hbh ? json.hb_arrive1_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_arrive1_base_date" value="'+(json.hb_arrive1_base_date ? json.hb_arrive1_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_arrive1_base_code" value="'+(json.hb_arrive1_base_code ? json.hb_arrive1_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_arrive1_base_qfsj" value="'+(json.hb_arrive1_base_qfsj ? json.hb_arrive1_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_arrive1_base_ddsj" value="'+(json.hb_arrive1_base_ddsj ? json.hb_arrive1_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_arrive1_info_price" value="'+(json.hb_arrive1_info_price ? json.hb_arrive1_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		var r = '';
  		if(json.hb_arrive1_info_price)
  		{
  			var expression = getExpression(json.hb_arrive1_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_arrive1_info_ydh" value="'+(json.hb_arrive1_info_ydh ? json.hb_arrive1_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_arrive1_info_jsqk">'+(json.hb_arrive1_info_jsqk ? json.hb_arrive1_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>2、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_arrive2_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_arrive2_base ? json.hb_arrive2_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班2详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_arrive2_info" placeholder="航班2详情">'+(json.hb_arrive2_info ? json.hb_arrive2_info : "")+'</textarea></span></div>';
  		info_html += '<div>2、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_arrive2_base_hbh" value="'+(json.hb_arrive2_base_hbh ? json.hb_arrive2_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_arrive2_base_date" value="'+(json.hb_arrive2_base_date ? json.hb_arrive2_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_arrive2_base_code" value="'+(json.hb_arrive2_base_code ? json.hb_arrive2_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_arrive2_base_qfsj" value="'+(json.hb_arrive2_base_qfsj ? json.hb_arrive2_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_arrive2_base_ddsj" value="'+(json.hb_arrive2_base_ddsj ? json.hb_arrive2_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_arrive2_info_price" value="'+(json.hb_arrive2_info_price ? json.hb_arrive2_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_arrive2_info_price)
  		{
  			var expression = getExpression(json.hb_arrive2_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_arrive2_info_ydh" value="'+(json.hb_arrive2_info_ydh ? json.hb_arrive2_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_arrive2_info_jsqk">'+(json.hb_arrive2_info_jsqk ? json.hb_arrive2_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>3、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_arrive3_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_arrive3_base ? json.hb_arrive3_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班3详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_arrive3_info" placeholder="航班3详情">'+(json.hb_arrive3_info ? json.hb_arrive3_info : "")+'</textarea></span></div>';
  		info_html += '<div>3、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_arrive3_base_hbh" value="'+(json.hb_arrive3_base_hbh ? json.hb_arrive3_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_arrive3_base_date" value="'+(json.hb_arrive3_base_date ? json.hb_arrive3_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_arrive3_base_code" value="'+(json.hb_arrive3_base_code ? json.hb_arrive3_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_arrive3_base_qfsj" value="'+(json.hb_arrive3_base_qfsj ? json.hb_arrive3_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_arrive3_base_ddsj" value="'+(json.hb_arrive3_base_ddsj ? json.hb_arrive3_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_arrive3_info_price" value="'+(json.hb_arrive3_info_price ? json.hb_arrive3_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_arrive3_info_price)
  		{
  			var expression = getExpression(json.hb_arrive3_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_arrive3_info_ydh" value="'+(json.hb_arrive3_info_ydh ? json.hb_arrive3_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_arrive3_info_jsqk">'+(json.hb_arrive3_info_jsqk ? json.hb_arrive3_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>4、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_arrive4_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_arrive4_base ? json.hb_arrive4_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班4详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_arrive4_info" placeholder="航班4详情">'+(json.hb_arrive4_info ? json.hb_arrive4_info : "")+'</textarea></span></div>';
  		info_html += '<div>4、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_arrive4_base_hbh" value="'+(json.hb_arrive4_base_hbh ? json.hb_arrive4_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_arrive4_base_date" value="'+(json.hb_arrive4_base_date ? json.hb_arrive4_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_arrive4_base_code" value="'+(json.hb_arrive4_base_code ? json.hb_arrive4_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_arrive4_base_qfsj" value="'+(json.hb_arrive4_base_qfsj ? json.hb_arrive4_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_arrive4_base_ddsj" value="'+(json.hb_arrive4_base_ddsj ? json.hb_arrive4_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html +='<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_arrive4_info_price" value="'+(json.hb_arrive4_info_price ? json.hb_arrive4_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_arrive4_info_price)
  		{
  			var expression = getExpression(json.hb_arrive4_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html +='<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_arrive4_info_ydh" value="'+(json.hb_arrive4_info_ydh ? json.hb_arrive4_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html +='<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_arrive4_info_jsqk">'+(json.hb_arrive4_info_jsqk ? json.hb_arrive4_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>5、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_arrive5_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_arrive5_base ? json.hb_arrive5_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班5详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_arrive5_info" placeholder="航班5详情">'+(json.hb_arrive5_info ? json.hb_arrive5_info : "")+'</textarea></span></div>';
  		info_html += '<div>5、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_arrive5_base_hbh" value="'+(json.hb_arrive5_base_hbh ? json.hb_arrive5_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_arrive5_base_date" value="'+(json.hb_arrive5_base_date ? json.hb_arrive5_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_arrive5_base_code" value="'+(json.hb_arrive5_base_code ? json.hb_arrive5_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_arrive5_base_qfsj" value="'+(json.hb_arrive5_base_qfsj ? json.hb_arrive5_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_arrive5_base_ddsj" value="'+(json.hb_arrive5_base_ddsj ? json.hb_arrive5_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_arrive5_info_price" value="'+(json.hb_arrive5_info_price ? json.hb_arrive5_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_arrive5_info_price)
  		{
  			var expression = getExpression(json.hb_arrive5_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_arrive5_info_ydh" value="'+(json.hb_arrive5_info_ydh ? json.hb_arrive5_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_arrive5_info_jsqk">'+(json.hb_arrive5_info_jsqk ? json.hb_arrive5_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		info_html += '</div></div>';
  		
  		//info_html += '<div style="font-size:20px;font-weight:bold;">离开：</div>';
  		info_html += '<div style="margin-left:10px;display:none;margin-top:56px;" class="hb_leave_div"><div style="margin-left:6px;">';
  		//info_html += '<div><span>1、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_leave1_base"  placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_leave1_base ? json.hb_leave1_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班1详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_leave1_info" placeholder="航班1详情">'+(json.hb_leave1_info ? json.hb_leave1_info : "")+'</textarea></span></div>';
  		info_html += '<div>1、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_leave1_base_hbh" value="'+(json.hb_leave1_base_hbh ? json.hb_leave1_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_leave1_base_date" value="'+(json.hb_leave1_base_date ? json.hb_leave1_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_leave1_base_code" value="'+(json.hb_leave1_base_code ? json.hb_leave1_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_leave1_base_qfsj" value="'+(json.hb_leave1_base_qfsj ? json.hb_leave1_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_leave1_base_ddsj" value="'+(json.hb_leave1_base_ddsj ? json.hb_leave1_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_leave1_info_price" value="'+(json.hb_leave1_info_price ? json.hb_leave1_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_leave1_info_price)
  		{
  			var expression = getExpression(json.hb_leave1_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_leave1_info_ydh" value="'+(json.hb_leave1_info_ydh ? json.hb_leave1_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_leave1_info_jsqk">'+(json.hb_leave1_info_jsqk ? json.hb_leave1_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>2、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_leave2_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_leave2_base ? json.hb_leave2_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班2详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_leave2_info" placeholder="航班2详情">'+(json.hb_leave2_info ? json.hb_leave2_info : "")+'</textarea></span></div>';
  		info_html += '<div>2、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_leave2_base_hbh" value="'+(json.hb_leave2_base_hbh ? json.hb_leave2_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_leave2_base_date" value="'+(json.hb_leave2_base_date ? json.hb_leave2_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_leave2_base_code" value="'+(json.hb_leave2_base_code ? json.hb_leave2_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_leave2_base_qfsj" value="'+(json.hb_leave2_base_qfsj ? json.hb_leave2_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_leave2_base_ddsj" value="'+(json.hb_leave2_base_ddsj ? json.hb_leave2_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_leave2_info_price" value="'+(json.hb_leave2_info_price ? json.hb_leave2_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_leave2_info_price)
  		{
  			var expression = getExpression(json.hb_leave2_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_leave2_info_ydh" value="'+(json.hb_leave2_info_ydh ? json.hb_leave2_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_leave2_info_jsqk">'+(json.hb_leave2_info_jsqk ? json.hb_leave2_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>3、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_leave3_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_leave3_base ? json.hb_leave3_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班3详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_leave3_info" placeholder="航班3详情">'+(json.hb_leave3_info ? json.hb_leave3_info : "")+'</textarea></span></div>';
  		info_html += '<div>3、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_leave3_base_hbh" value="'+(json.hb_leave3_base_hbh ? json.hb_leave3_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_leave3_base_date" value="'+(json.hb_leave3_base_date ? json.hb_leave3_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_leave3_base_code" value="'+(json.hb_leave3_base_code ? json.hb_leave3_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_leave3_base_qfsj" value="'+(json.hb_leave3_base_qfsj ? json.hb_leave3_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_leave3_base_ddsj" value="'+(json.hb_leave3_base_ddsj ? json.hb_leave3_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_leave3_info_price" value="'+(json.hb_leave3_info_price ? json.hb_leave3_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_leave3_info_price)
  		{
  			var expression = getExpression(json.hb_leave3_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_leave3_info_ydh" value="'+(json.hb_leave3_info_ydh ? json.hb_leave3_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_leave3_info_jsqk">'+(json.hb_leave3_info_jsqk ? json.hb_leave3_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>4、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_leave4_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_leave4_base ? json.hb_leave4_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班4详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_leave4_info" placeholder="航班4详情">'+(json.hb_leave4_info ? json.hb_leave4_info : "")+'</textarea></span></div>';
  		info_html += '<div>4、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_leave4_base_hbh" value="'+(json.hb_leave4_base_hbh ? json.hb_leave4_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_leave4_base_date" value="'+(json.hb_leave4_base_date ? json.hb_leave4_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_leave4_base_code" value="'+(json.hb_leave4_base_code ? json.hb_leave4_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_leave4_base_qfsj" value="'+(json.hb_leave4_base_qfsj ? json.hb_leave4_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_leave4_base_ddsj" value="'+(json.hb_leave4_base_ddsj ? json.hb_leave4_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_leave4_info_price" value="'+(json.hb_leave4_info_price ? json.hb_leave4_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_leave4_info_price)
  		{
  			var expression = getExpression(json.hb_leave4_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_leave4_info_ydh" value="'+(json.hb_leave4_info_ydh ? json.hb_leave4_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_leave4_info_jsqk">'+(json.hb_leave4_info_jsqk ? json.hb_leave4_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		
  		//info_html += '<div><span>5、基本信息：<textarea style="margin-left:10px;width:95%;height:50px;" class="hb_leave5_base" placeholder="航班号、日期、两端机场代码缩写、起飞（抵达）时间">'+(json.hb_leave5_base ? json.hb_leave5_base : "")+'</textarea></span></div>';
  		//info_html += '<div><span>航班5详情：<textarea style="margin-left:10px;width:95%;height:'+(h-115)+'px;" class="hb_leave5_info" placeholder="航班5详情">'+(json.hb_leave5_info ? json.hb_leave5_info : "")+'</textarea></span></div>';
  		info_html += '<div>5、航班号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="航班号" class="hb_leave5_base_hbh" value="'+(json.hb_leave5_base_hbh ? json.hb_leave5_base_hbh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>日期：<input style="margin-left:10px;width:95%;height:30px;" placeholder="日期" class="hb_leave5_base_date" value="'+(json.hb_leave5_base_date ? json.hb_leave5_base_date : "")+'" /></div>';
  		info_html += '<div>两端机场代码缩写：<input style="margin-left:10px;width:95%;height:30px;" placeholder="两端机场代码缩写" class="hb_leave5_base_code" value="'+(json.hb_leave5_base_code ? json.hb_leave5_base_code : "")+'" /></div>';
  		info_html += '<div>起飞时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="起飞时间" class="hb_leave5_base_qfsj" value="'+(json.hb_leave5_base_qfsj ? json.hb_leave5_base_qfsj : "")+'" /></div>';
  		info_html += '<div>抵达时间：<input style="margin-left:10px;width:95%;height:30px;" placeholder="抵达时间" class="hb_leave5_base_ddsj" value="'+(json.hb_leave5_base_ddsj ? json.hb_leave5_base_ddsj : "")+'" /></div>';
  		//info_html += '<div>详细情况：<div style="margin-left:13px;">';
  		info_html += '<div>价格：<input style="margin-left:2px;width:68%;height:30px;" placeholder="价格" onblur="window.computeJingDianAndAirPortResult(this)" class="hb_leave5_info_price" value="'+(json.hb_leave5_info_price ? json.hb_leave5_info_price.replace(/"/g,'&quot;') : "")+'" />';
  		r = '';
  		if(json.hb_leave5_info_price)
  		{
  			var expression = getExpression(json.hb_leave5_info_price);
  			r = eval(expression);
  			if(isNaN(r))
  			{
  				r = '';
  			}
  		}
  		info_html +='<span style="width:15%">='+r+'</span></div>';
  		info_html += '<div>预订号：<input style="margin-left:10px;width:95%;height:30px;" placeholder="预订号" class="hb_leave5_info_ydh" value="'+(json.hb_leave5_info_ydh ? json.hb_leave5_info_ydh.replace(/"/g,'&quot;') : "")+'" /></div>';
  		info_html += '<div>结算情况：<textarea style="margin-left:10px;width:95%;height:'+((h-150)>120 ?(h-150):120)+'px;" placeholder="结算情况" class="hb_leave5_info_jsqk">'+(json.hb_leave5_info_jsqk ? json.hb_leave5_info_jsqk : "")+'</textarea></div>';
  		//info_html += '</div></div>';
  		info_html += '</div></div>';
  		
  		info_html += '<div style="text-align: center;"><button class="btn_cancel" onclick="window.cancelDiv(this)">取消</button><button class="btn_submit" onclick="window.submitDayInfo(this)">提交</button></div>';
  		$(div).append(info_html);
  		$("body").append(div);
  		for(var i=1;i<=5;i++)
  		{
  			$($(div).find('.hb_arrive'+i+'_base_date')[0]).datepicker();
  			$($(div).find('.hb_leave'+i+'_base_date')[0]).datepicker();
  		}
  	}
  	$(div).scrollTop(0);
  	if(!hb_arrive)
  	{
  		$($(div).find('.hb_leave1_base_hbh')[0]).focus();
  	}
  	else
  	{
  		$($(div).find('.hb_arrive1_base_hbh')[0]).focus();
  	}
  	show = e;
  	currentShowDiv = div;
  }
  window.showAirPortDiv = showAirPortDiv;
  function trHtml(date,begin,length,rid)
  {
  	var tr_html = '';
  	var startDate = date;
  	for(var i=begin;i<=length;i++)
	{
		tr_html+='<tr  id="'+rid+'" class="day" data-days="'+(i+1)+'">';
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
					tr_html+='<td style="width:140px;"><input class="'+dayClassName[j]+'" onclick="window.showDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'"/></td>';
			}
			else if(j==2)
				tr_html+='<td style="width:300px;"><input class="'+dayClassName[j]+'" onclick="window.showHotelDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==3 || j==7)
				tr_html+='<td style="width:200px;"><input class="'+dayClassName[j]+'" onclick="window.showTextAreaDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==8 || j==9 || j==10)
			{	
				tr_html+='<td';
				if(j==7) tr_html+=' style="width:110px;">';
				else if(j==9) tr_html+=' style="width:85px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showSimpleDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==11)
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showDinnerDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==12)
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showJingDianDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else if(j==13)
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showAirPortDiv(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			else
			{
				if(j==1) continue;
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
  	date = date_string.split('/');
  	month = date[0];
  	if(parseInt(month)<10) month = '0'+month;
  	return date[2]+'-'+month+'-'+date[1];
  }
  function sendMessage(rid,msg)
  {
  	msgObject = { _id: Random.id(), rid: rid, msg: msg}
  	//console.log(msgObject);
  	Meteor.call('sendMessage',msgObject,function(error,result){
  		//console.log('sendMessage');
  		//console.log(error);
  		//console.log(result);
  		if(!error)
  		{
  			msg = result.msg.replace(':=','');
  			jsonMsg = JSON.parse(msg);
  			if(jsonMsg && jsonMsg instanceof Array && jsonMsg.length>0)
  			{
  				//console.log(jsonMsg);
				json = jsonMsg[0];
				for(var kset in json)
				{
					data = json[kset];
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
											if(showValue.length == 0 || showValue.indexOf('抵达') == -1)
											{
												vbase = "抵达："+vbase;
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
											if(showValue.length == 0 || showValue.indexOf('离开') == -1)
											{
												vbase = "；离开："+vbase;
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
													showValue += ' / '+vbase;
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
									if(showValue.length>0) 
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
  											if(r.ext.days[day])
  												jsValue = r.ext.days[day];
  											//else jsValue[day] = {};
  											//console.log(jsValue);
  											//console.log(value);
  											jsValue[className] = value;
  											//console.log(jsValue);
  											r.ext.days[day] = jsValue;
  											//console.log(r);
  										}
  										else
  										{
  											r.ext['days'] = jsValue;
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
  											if(r.ext.days[day])
  												jsValue = r.ext.days[day];
  											//else jsValue[day] = {};
  											jsValue[className] = value;
  											r.ext.days[day] = jsValue;
  											//r.ext.days[day][className] = value;
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
  	//console.log(t)
  	var value = $(t).val();
  	if(value && value.length>0)
  	{
  		msg = ':=[{"$set": {"ext.'+$(t).attr("class")+'":"'+value+'"}}]';
  		show = t;
  		sendMessage(rid,msg);
  	}
  }
  window.inputChange = inputChange;
  function findRoomByRid(rid)
  {
  	for(var index in rooms)
  	{
  		r = rooms[index];
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
  		tr = $(t).parent().parent().parent();
  		trs = $(tr).nextAll("tr#"+rid);
  		if( time<= 0)
  		{
  			alert('结束日期要大于开始日期');
  			if(trs && trs.length>0)
  			{
  				first = new Date(dateformat($($(trs[0]).children('td')[1]).text()));
  				end = new Date(dateformat($($(trs[trs.length-1]).children('td')[1]).text()));
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
  			st = $("#"+startId);
  			msg = ':=[{"$set":{"ext.'+$(st).attr('class').replace(' hasDatepicker','')+'":"'+startValue+'","ext.'+$(t).attr('class').replace(' hasDatepicker','')+'":"'+endValue;
  			length = time/1000/3600/24;
  			if(trs && trs.length>0)
  			{
  				msg +='"}}]';
  				sendMessage(rid,msg);
  				first = new Date(dateformat($($(trs[0]).children('td')[1]).text()));
  				end = new Date(dateformat($($(trs[trs.length-1]).children('td')[1]).text()));
  				if(confirm('确定要修改日期？'))
  				{
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
  							td = $(trs[i]).children('td');
  							td_week = '';
  							w = startDate.getDay();
							month = startDate.getMonth()+1;
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
							
							day = startDate.getDate();
							if(day<10) day = '0'+day;
							dateString = month+'/'+day+'/'+startDate.getFullYear();
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
  				$(tr).after(tr_html);
  			}
  			//console.log(msg)
  			//console.log(JSON.parse(msg.replace(':=','')));
  		}
  	}
  }
  window.dateChange = dateChange;
  function daysInputClick(t)
  {
  	$(".tablecontainer").hide();
  	$(".tablesimple").hide();
  	$(".tabledinner").hide();
  	$(".tablehotel").hide();
  	$(".tablejingdian").hide();
  	$(".tableairport").hide();
  	$(".tableTextAreaDiv").hide();
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
  		msg = '';
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
						if(!value) json[dayClassName[j]].th_base_name;
						if(json[dayClassName[j]].th_base_city&&json[dayClassName[j]].th_base_name)
							value += " "+json[dayClassName[j]].th_base_name;
						if(value.length>0) value = value.replace(/"/g,'&quot;');
					}
					tr_html+='<td style="width:140px;"><input class="'+dayClassName[j]+'" onclick="window.showDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'"/></td>';
				}
			}
			else if(j==2)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].hotel_base_xc)
				{
					value = json[dayClassName[j]].hotel_base_xc;
					if(json[dayClassName[j]].hotel_base_dm)
						value += " / "+json[dayClassName[j]].hotel_base_dm;
					//console.log(value);
					if(value.length>0) value = value.replace(/"/g,'&quot;');
					//console.log(value);
				}
				tr_html+='<td style="width:300px;"><input class="'+dayClassName[j]+'" onclick="window.showHotelDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==3 || j==7)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].textarea_base)
					value = json[dayClassName[j]].textarea_base;
				if(value.length>0) value = value.replace(/"/g,'&quot;');
					
				tr_html+='<td style="width:200px;"><input class="'+dayClassName[j]+'" onclick="window.showTextAreaDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
			else if(j==8 || j==9 || j==10)
			{
				if(json[dayClassName[j]] && json[dayClassName[j]].simple_base)
					value = json[dayClassName[j]].simple_base;
				if(value.length>0) value = value.replace(/"/g,'&quot;');
				tr_html+='<td';
				if(j==7) tr_html+=' style="width:110px;">';
				else if(j==9) tr_html+=' style="width:85px;">';
				else tr_html+= '>';
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.showSimpleDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
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
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showDinnerDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
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
				tr_html+='<td><input class="'+dayClassName[j]+'" onclick="window.showJingDianDiv(this)" value="'+value+'" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
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
				tr_html+='<input class="'+dayClassName[j]+'" onclick="window.daysInputClick(this)" value="'+(json[dayClassName[j]] ? json[dayClassName[j]].replace(/"/g,'&quot;') : "")+'" onchange="window.daysInputChange(this)" style="width:100%;border:0px;height:25px;" id="'+rid+'" data-day="'+(i+1)+'" /></td>';
			}
		}
		tr_html += '</tr>';
	return tr_html;
  }
  function tbodyHTML(contents)
  {
  	var tbody_html ='';
  	for(var index in contents)
    {
        var single = contents[index];
        if(contents.length>1)
        {
        	var mc = single.name;
        	if(!mc)
        	{
        		if(single.t == "d")
        		{
        			usn = single.usernames;
        			mc = usn[0] +"<->"+ usn[1];
        		}
        	}
        	tbody_html +='<tr><td colspan="16"><span style="font-size:18px;">组的名称：'+mc+'</span></td></tr>';
        }
        //if(single.ext.name)
        {
        	var info = single.ext;
        	tbody_html +='<tr>';
        	tbody_html +='<td colspan="15"><span>项目名称：<input id="'+single._id+'" style="width:96%;border:0px;height:25px;" class="name" placeholder="项目名称" onclick="window.daysInputClick(this)" value="'+(info.name ? info.name : "")+'" onchange="window.inputChange(this,\''+single._id+'\')" /></span></td>';
        	tbody_html +='</tr>';
        	tbody_html +='<tr><td colspan="15"><span>组团单位：<input id="'+single._id+'" style="width:96%;border:0px;height:25px;" class="ztdanwei" placeholder="组团单位" onclick="window.daysInputClick(this)" value="'+(info.ztdanwei ? info.ztdanwei : "")+'"  onchange="window.inputChange(this,\''+single._id+'\')" /></span></td></tr>';
        	tbody_html +='<tr><td colspan="15"><span>团号：<input id="'+single._id+'" style="width:97%;border:0px;height:25px;" class="zttuanhao" placeholder="团号" onclick="window.daysInputClick(this)" value="'+(info.zttuanhao ? info.zttuanhao : "")+'"  onchange="window.inputChange(this,\''+single._id+'\')" /></span></td></tr>';        	
        	tbody_html +='<tr><td colspan="15"><span>大人人数：<input id="'+single._id+'" style="width:40%;border:0px;height:25px;" value="'+(info.adult_number ? info.adult_number : "")+'" class="adult_number" onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span>';
        	tbody_html +='<span>儿童人数：<input id="'+single._id+'" style="width:40%;border:0px;height:25px;" value="'+(info.children_number ? info.children_number : "")+'" class="children_number"  onclick="window.daysInputClick(this)" onchange="window.inputChange(this,\''+single._id+'\')" /></span></td></tr>';
        	tbody_html +='<tr><td colspan="15"><span>开始日期：<input id="start-date'+single._id+'" style="width:40%;border:0px;height:25px;" value="'+(info.startdate ? info.startdate : "")+'" class="startdate" onclick="window.daysInputClick(this)" /></span>';
        	tbody_html +='<span>结束日期：<input id="end-date'+single._id+'" style="width:40%;border:0px;height:25px;" value="'+(info.enddate ? info.enddate : "")+'" class="enddate"  onclick="window.daysInputClick(this)" onchange="window.dateChange(this,\''+single._id+'\')" /></span></td></tr>';
        	
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
        }
    }
    return tbody_html;
  }
  function changeTabPage(t,index)
  {
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
  	room = [];
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
  		for(var index in room)
  		{
  			$("#start-date"+(room[index]._id)).datepicker();
  			$("#end-date"+(room[index]._id)).datepicker();
  		}
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
	html+='<table cellspacing="0"><thead><tr class="complex-top"><th class="third" rowspan="2"><div class="th-inner" style="width:20px;">星期</div></th><th class="third" rowspan="2"><div class="th-inner">日期</div></th><th class="third" rowspan="2"><div class="th-inner">导游</div>';
	html+='</th><th class="second" colspan="5"><div class="th-inner" >酒店</div></th><th class="third" rowspan="2"><div class="th-inner">预定号</div>';
	html+='</th><th class="third" rowspan="2"><div class="th-inner">车公司</div></th><th class="third" rowspan="2"><div class="th-inner">用车时间</div></th><th class="third" rowspan="2"><div class="th-inner">司机</div>';
	html+='</th><th class="third" rowspan="2"><div class="th-inner">用餐</div></th><th class="third" rowspan="2"><div class="th-inner">景点门票</div></th><th class="third" rowspan="2"><div class="th-inner">抵达／离开时间</div>';
	html+='</th></tr><tr class="complex-bottom"><th class="second"><div class="th-inner">酒店名</div></th><th class="second"><div class="th-inner">付款</div></th><th class="second"><div class="th-inner">双</div>';
	html+='</th><th class="second"><div class="th-inner">单</div></th><th class="second"><div class="th-inner">司导</div></th></tr></thead><tbody class="tbody_content">';
    
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
    setTimeout(function() {
      var doc = document.getElementById(id);
      $(doc).remove();
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
  for(var index in ext)
  {
  	$("#start-date"+(ext[index]._id)).datepicker();
  	$("#end-date"+(ext[index]._id)).datepicker();
  }
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
  	if((className == $(".fixed-table-container-inner").attr('class')) || children.length == 0)
  	{
  		show = null;
  		currentShowDiv = null;
  		$(".tablecontainer").hide();
  		$(".tablesimple").hide();
  		$(".tabledinner").hide();
  		$(".tablehotel").hide();
  		$(".tablejingdian").hide();
  		$(".tableairport").hide();
  		$(".tableTextAreaDiv").hide();
  	}
  });
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
