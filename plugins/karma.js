/*
 * @Plugin        Karma
 * @Description   Karma system based on Stack Overflow's Reputation system.
 * @Trigger      .karma
 *
 * @Author        Killswitch (Josh Manders)
 * @Website       http://www.joshmanders.com
 * @Copyright     Josh Manders 2012
 *
 */

var mongodb = require('mongojs'),
    howLong = require('../libs/ago.js');

Date.prototype.hourAgo = function () {
  this.setHours(this.getHours() - 1);
  return this;
}

Date.prototype.fifteenMinsAgo = function () {
  this.setMinutes(this.getMinutes() - 15);
  return this;
}

Plugin = exports.Plugin = function (irc) {
  irc.addTrigger('karma', this.karma);
  this.db = mongodb.connect(irc.database, ['karma']);
  this.irc = irc;
};

Plugin.prototype.onMessage = function (msg) {
  var to, users, irc = this.irc,
      nick = this.irc.user(msg.prefix).toLowerCase(),
      channel = msg.arguments[0],
      message = msg.arguments[1],
      botNick = this.irc.nick.toLowerCase(),
      karma = this.db.karma;
  Object.keys(irc.users).forEach(function (user) {
  if (user != irc.nick.toLowerCase() && user != nick)
    {
      users += ' ' + user;
    }
  });
  if (channel == this.irc.nick)
  {
    return;
  }
  if (to = message.match(/^(\w+)\+\+;?$/i)) {
    var user = to[1].toLowerCase();
    if (user != botNick && user != nick && users.indexOf(user) != -1) {
      karma.find({ to: user, from: nick, channel: channel, action: 'give' }).sort({ date: -1 }).limit(1, function (err, check) {
        var fifteenMinsAgo = new Date().fifteenMinsAgo(),
            now = new Date();
        if (check.length > 0) {
          if ((check[0].date <= now) && (check[0].date >= fifteenMinsAgo))  {
            irc.send(channel, nick + ': Can not give karma to the same person in a 15 minute span.');
          }
          else {
            karma.save({ to: user, from: nick, channel: channel, action: 'give', date: new Date() });
            irc.send(channel, nick + ': Karma given to ' + user);
          }
        }
        else {
          karma.save({ to: user, from: nick, channel: channel, action: 'give', date: new Date() });
          irc.send(channel, nick + ': Karma given to ' + user);
        }
      });
    }
  }
};

Plugin.prototype.karma = function (irc, channel, nick, params, message, raw) {
  this.db.karma.find({ to: nick, channel: channel, action: 'give' }, function (err, karma) {
    irc.send(channel, nick + ': You have ' + karma.length + ' total karma.');
  });
};