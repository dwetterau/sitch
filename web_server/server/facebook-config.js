ServiceConfiguration.configurations.remove({
    service: 'facebook'
});

ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: process.env.FB_APP_ID,
    secret: process.env.FB_APP_SECRET
});

Accounts.onCreateUser(function(options, user) {
    options.profile.email = user.services.facebook.email;
    options.profile.facebookId = user.services.facebook.id;

    user.profile = options.profile;

    return user;
});
