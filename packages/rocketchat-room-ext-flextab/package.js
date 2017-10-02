Package.describe({
	name: 'rocketchat:room-ext-flextab',
	version: '0.0.1',
	summary: 'Room Ext Flextab',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'mongo',
		'session',
		'tracker',
		'coffeescript',
		'jquery',
		'underscore',
		'less@2.5.0',
		'rocketchat:lib',
		'rocketchat:ui',
		'accounts-base',
		'reactive-var',
		'ecmascript',
		'less@2.5.0',
		'raix:push',
		'raix:ui-dropped-event'
	]);

	api.addFiles([
		'client/lib/datepicker-ui.js',
		'client/stylesheets/extInRooms.less',
		'client/stylesheets/datepicker-ui.css',
		'client/lib/displayRoomExt.js',
		'client/tabBar.coffee'
	], 'client');
	api.addAssets([
		'client/stylesheets/images/ui-icons_ffffff_256x240.png',
		'client/stylesheets/images/ui-bg_gloss-wave_35_f6a828_500x100.png'
	],'client');

	api.addFiles([
		'server/publications/extInRooms.coffee',
		'server/methods/findUserData.coffee',
		'server/methods/findHotel.coffee',
	], 'server');

	// TAPi18n
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync(
		'packages/rocketchat-room-ext-flextab/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-room-ext-flextab/i18n/' + filename)
			.size > 16) {
			if(filename != '.DS_Store')
				return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});
