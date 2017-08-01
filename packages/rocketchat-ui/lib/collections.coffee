@ChatMessage = new Meteor.Collection null
@ChatRoom = new Meteor.Collection 'rocketchat_room'
@ChatSubscription = new Meteor.Collection 'rocketchat_subscription'
@RoomModeratorsAndOwners = new Mongo.Collection null
@UserAndRoom = new Meteor.Collection null
@CachedChannelList = new Meteor.Collection null
@ExtInRooms = new Mongo.Collection 'ext_in_rooms'

RocketChat.models.Users = _.extend {}, RocketChat.models.Users, Meteor.users
RocketChat.models.Subscriptions = _.extend {}, RocketChat.models.Subscriptions, @ChatSubscription
RocketChat.models.Rooms = _.extend {}, RocketChat.models.Rooms, @ChatRoom
RocketChat.models.Messages = _.extend {}, RocketChat.models.Messages, @ChatMessage
