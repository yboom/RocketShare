Package.describe({
	name: 'rocketchat:oembed',
	version: '0.0.1',
	summary: 'Message pre-processor that insert oEmbed widget in template',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'templating',
		'coffeescript',
		'underscore',
		'konecty:change-case',
		'rocketchat:lib'
	]);

	api.addFiles('client/baseWidget.html', 'client');
	api.addFiles('client/baseWidget.coffee', 'client');

	api.addFiles('client/oembedImageWidget.html', 'client');
	api.addFiles('client/oembedImageWidget.coffee', 'client');

	api.addFiles('client/oembedAudioWidget.html', 'client');

	api.addFiles('client/oembedVideoWidget.html', 'client');
	api.addFiles('client/oembedVideoWidget.coffee', 'client');

	api.addFiles('client/oembedYoutubeWidget.html', 'client');

	api.addFiles('client/oembedUrlWidget.html', 'client');
	api.addFiles('client/oembedUrlWidget.coffee', 'client');

	api.addFiles('client/oembedInternalUrlWidget.html', 'client');
	api.addFiles('client/oembedInternalUrlWidget.coffee', 'client');

	api.addFiles('client/oembedFrameWidget.html', 'client');

	api.addFiles('server/server.coffee', 'server');
	api.addFiles('server/providers.coffee', 'server');
	api.addFiles('server/models/OEmbedCache.coffee', 'server');

	api.export('OEmbed', 'server');
});

Package.onTest(function(api) {

});
