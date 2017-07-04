RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	function updateRoomExt(message,room)
	{
		msg = message.msg;
		msg = msg.replace('：',':');
		msg = msg.replace('＝','=');
		if(msg.indexOf(':=') == 0)
		{
			//console.log(msg);
			//console.log(room);
			msg = msg.replace(':=','');
			msg = msg.replace(/：/gm,':');
			msg = msg.replace(/＝/gm,'=');
			msg = msg.replace(/\［/gm,'[');
			msg = msg.replace(/\］/gm,']');
			msg = msg.replace(/\｛/gm,'{');
			msg = msg.replace(/\｝/gm,'}');
			msg = msg.replace(/“/gm,'"');
			msg = msg.replace(/”/gm,'"');
			msg = msg.replace(/‘/gm,'"');
			msg = msg.replace(/’/gm,'"');
			msg = msg.replace(/'/gm,'"');
			json = JSON.parse(msg);
			if(json && json instanceof Array)
			{
				if(json.length>0)
				{
      				console.log(json);
      				index = 0;
      				do{
      					condition = json[index];
      					for(var key in condition)
      					{
      						if(key.indexOf('$') == 0)
      						{

      							rm = RocketChat.models.Rooms.updateRoomExtById({_id:message.rid},condition);
      							console.log('update');
      							console.log(rm);
      							index = index+1;
      						}
      						else
      						{
      							if(index+1 <json.length)
      							{
      								update = json[index+1];
      								condition._id = message.rid;
      								rm = RocketChat.models.Rooms.updateRoomExtById(condition,update);
	      							console.log('update');
    	  							console.log(rm);
      								index = index+2;
      							}
      						}
      						break;
      					}
      				}while((index+1)<json.length)
				}
			}
		}
	}
	if (message.editedAt) {
		//updateRoomExt(message,room);
		return message;
	}
	updateRoomExt(message,room);
	return message;

}, RocketChat.callbacks.priority.LOW);
