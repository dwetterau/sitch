ServiceConfiguration.configurations.remove({
    service: 'facebook'
});

ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: process.env.FB_APP_ID,
    secret: process.env.FB_APP_SECRET
});

Accounts.onCreateUser(function(options, user) {
    console.log(options, user);
    options.profile.email = user.services.facebook.email;
    options.profile.facebookId = user.services.facebook.id;

    user.profile = options.profile;
    console.log("got user profile", user.profile);

    // Send a welcome message. This really shouldn't be in the auth flow.
    Meteor.call(
        "sendMessageToUser",
        user.profile.facebookId,
        "Welcome to Sitch!"
    );
    return user;
});
