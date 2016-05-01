function getSqliteDate() {
	//format to what sqlite knows: YYYY-MM-DD HH:MM:SS.SSS
	var today = new Date();
	var dat = "";
	var yy = today.getYear();
	dat += (yy < 1000) ? yy + 1900 : yy;
	dat += "-";
	var m = today.getMonth() + 1;
	dat += (m < 10) ? '0' + m : m;
	dat += "-";
	var d = today.getDate();
	dat += (d < 10) ? '0' + d : d;
	dat += " ";
	d = today.getHours();
	dat += (d < 10) ? '0' + d : d;
	dat += ":";
	d = today.getMinutes();
	dat += (d < 10) ? '0' + d : d;
	dat += ":";
	d = today.getSeconds();
	dat += (d < 10) ? '0' + d : d;

	return dat;
}
yboom = {};
yboom.websql = {};

yboom.websql.rooms = [];
try {
	yboom.websql.rooms = JSON.parse(localStorage.getItem("yboom.rooms"));
} catch (e) {
	console.error("DB exception:" + e);
	yboom.websql.rooms = [];
}
if (yboom.websql.rooms == null)
	yboom.websql.rooms = [];
yboom.websql.findRoomId = function(_id) {
	for (i = 0; i < yboom.websql.rooms.length; i++) {
		if (yboom.websql.rooms[i]._id == _id) {
			return i;
		}
	}
	yboom.websql.rooms.push({
		_id: _id,
	});
	localStorage.setItem("yboom.rooms", JSON.stringify(yboom.websql.rooms));
	return yboom.websql.rooms.length - 1;
}
yboom.websql.updateRoom = function(_id, name, type) {
	for (i = 0; i < yboom.websql.rooms.length; i++) {
		if (yboom.websql.rooms[i]._id == _id) {
			yboom.websql.rooms[i].n = name;
			yboom.websql.rooms[i].t = type;
		}
	}
	yboom.websql.rooms.push({
		_id: _id,
		n: name,
		t: type
	});
	localStorage.setItem("yboom.rooms", JSON.stringify(yboom.websql.rooms));
}

yboom.websql.users = [];
try {
	yboom.websql.users = JSON.parse(localStorage.getItem("yboom.users"));
} catch (e) {
	console.error("DB exception:" + e);
	yboom.websql.users = [];
}
if (yboom.websql.users == null)
	yboom.websql.users = [];
yboom.websql.findUserId = function(_id, name) {
	for (i = 0; i < yboom.websql.users.length; i++) {
		if (yboom.websql.users[i]._id == _id) {
			return i;
		}
	}
	yboom.websql.users.push({
		_id: _id,
		n: name
	});
	localStorage.setItem("yboom.users", JSON.stringify(yboom.websql.users));
	return yboom.websql.users.length - 1;
}
yboom.websql.updateUser = function(_id, name) {
	for (i = 0; i < yboom.websql.users.length; i++) {
		if (yboom.websql.users[i]._id == _id) {
			yboom.websql.users[i].n = name;
		}
	}
	yboom.websql.users.push({
		_id: _id,
		n: name
	});
	localStorage.setItem("yboom.users", JSON.stringify(yboom.websql.users));
}

yboom.websql.db = null;
yboom.websql.user = null;
//yboom.websql.insertNum=0;
yboom.websql.onSuccess = function(tx, rs) {
	console.log("操作成功");
}
yboom.websql.onError = function(tx, error) {
	console.log("操作失败，失败信息：" + error.message);
}
yboom.websql.open = function() {
	try {
		yboom.websql.dbSize = 2 * 1024 * 1024;
		if (yboom.websql.db == null && typeof openDatabase !== 'undefined')
			yboom.websql.db = openDatabase("yboom.RocketShare", "1.0", "RocketShare",
				yboom.websql.dbSize);
	} catch (e) {
		console.error("DB exception:" + e);
	}
	return yboom.websql.db;
}

yboom.websql.createTable = function() {
	var db = yboom.websql.open();
	if (db) {
		db.transaction(function(tx) {
			tx.executeSql(
				"CREATE TABLE IF NOT EXISTS document(_id CHAR(24) PRIMARY KEY,ts INTEGER, roomid INTEGER, uid INTEGER, txt NVARCHAR(4000))", [],
				yboom.websql.init, yboom.websql.onError);
		});
	} else {
		console.error("Can not open db");
	}
}

yboom.websql.init = function() {

	yboom.websql.setDoc = function(_id, ts, roomid, uid, txt) {
		var db = yboom.websql.db; //yboom.websql.open();
		if (db) {
			db.transaction(function(tx) {
				tx.executeSql(
					"REPLACE INTO document(_id,ts,roomid,uid,txt) VALUES (?,?,?,?,?)", [
						_id,
						ts,
						roomid, uid, txt
					],
					function() {
						//console.log("replaced " + _id + "," + roomid);
					},
					function(tx, e) {
						if (e.code == 6 || e.code == 1) {
							console.warn(" Skip duplicated record:" + e.message);
						} else {
							console.error(" DB error: " + e.message + "(" + e.code + ")");
						}
						return false;
					});
			});
		}
	}

	yboom.websql.searchMessage = function(keyword, limit, callback) {
		var db = yboom.websql.db; //yboom.websql.open();
		if (db) {
			db.transaction(function(tx) {
				tx.executeSql(
					"SELECT * FROM document WHERE txt LIKE ? ORDER BY ts DESC", [
						'%' + keyword + '%'
					],
					function(tx, results) {
						//console.log("replaced " + _id + "," + roomid);
						items = [];
						for (var i = 0; i < results.rows.length; i++) {
							var row = results.rows.item(i);
							var u = yboom.websql.users[row["uid"]];
							var room = yboom.websql.rooms[row["roomid"]];
							items.push({
								_id: row["_id"],
								u: {
									_id: u._id,
									username: u.n
								},
								rid: room._id,
								t: room.t,
								name: room.n,
								msg: row["txt"]
							});
						}
						callback(null, items);
					},
					function(tx, e) {
						console.error(" DB error: " + e.message + "(" + e.code + ")");
						callback(e, []);
					});
			});
		}
	}
}

yboom.websql.createTable();
//yboom.websql.setDoc('TEST',"测试的文档"+(new Date()));
