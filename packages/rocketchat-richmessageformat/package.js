Package.describe({
	name: 'rocketchat:richmessageformat',
	version: '0.0.1',
	summary: 'Message pre-processor that will translate formats on messages',
	git: ''
});

Package.onUse(function(api) {
	api.versionsFrom('1.0');

	api.use([
		'coffeescript',
		'underscore',
		'rocketchat:lib'
	]);

	api.addFiles('richmessageformat.coffee', ['server', 'client']);
});

Package.onTest(function(api) {

});
