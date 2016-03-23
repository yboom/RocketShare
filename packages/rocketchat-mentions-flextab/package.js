Package.describe({
	name: 'rocketchat:mentions-flextab',
	version: '0.0.1',
	summary: 'Mentions Flextab',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'less@2.5.0',
		'rocketchat:lib'
	]);

	api.addFiles([
		'client/lib/MentionedMessage.coffee',
		'client/lib/ChannelGroupMessage.coffee',
		'client/views/stylesheets/mentionsFlexTab.less',
		'client/views/stylesheets/channelsGroupsFlexTab.less',
		'client/views/mentionsFlexTab.html',
		'client/views/mentionsFlexTab.coffee',
		'client/views/channelsGroupsFlexTab.html',
		'client/views/channelsGroupsFlexTab.coffee',
		'client/actionButton.coffee',
		'client/tabBar.coffee'
	], 'client');

	api.addFiles([
		'server/publications/mentionedMessages.coffee',
		'server/publications/channelGroupMessages.coffee'
	], 'server');

	// TAPi18n
	api.use('templating', 'client');
	var _ = Npm.require('underscore');
	var fs = Npm.require('fs');
	tapi18nFiles = _.compact(_.map(fs.readdirSync(
		'packages/rocketchat-mentions-flextab/i18n'), function(filename) {
		if (fs.statSync('packages/rocketchat-mentions-flextab/i18n/' + filename)
			.size > 16) {
			return 'i18n/' + filename;
		}
	}));
	api.use('tap:i18n');
	api.addFiles(tapi18nFiles);
});

Package.onTest(function(api) {

});
