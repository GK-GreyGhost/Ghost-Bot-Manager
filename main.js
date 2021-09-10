const tmi = require('tmi.js');

/*
    Discord support will be added back soon
    Web config is in the works
*/

/*=========================
===== Config Settings =====
==========================*/

const cheerMessage = `Thank you so much for the bits! :D @%username`; //%username will be replaced with the cheering users name
const subMessage = ``;
const subGiftMessage = ``;
// Define configuration options
const opts = {
    identity: {
      username: "twitch account name", //bot's twitch account name
      password: "oauth token" // you can get this code by visiting this page https://twitchapps.com/tmi/ while logged in on your bot account
    },
    channels: [
      "channel name" //put your channel name here, it must match exactly
    ]
  };

/*
    commands that anyone can run
    //these use template strings - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
    msg.username - the speaker's username
    msg.is_mod - bool (true or false) if user is a mod
*/

const commands = { 
    "!hello":function(msg,callback){
        if(msg.is_mod){
            callback(`Hello ${msg.username}, Thank you for modding the channel!`);
        }else if(msg.is_owner){
            callback(`Hello ${msg.username}, go get em! :D`);
        }else{
            callback(`Hello ${msg.username}, Thank you for watching!`);
        }
    },
    "!commands":function(msg,callback){
        callback("Available Commands:\n"+Object.keys(commands).join('\n'));
    },
    "!prime":function(msg,callback){
        callback(`You can sub for Free with Amazon Prime! Find out how - https://help.twitch.tv/s/article/how-to-subscribe?language=en_US#Prime`);
    },
    "!socials":function(msg,callback){
        callback(`Join our community! :D`);
    },
    "!s":function(msg,callback){
        //!s runs !socials
        commands['!socials'](msg,callback);
    },
    "!social":function(msg,callback){
        //!social runs !social
        commands['!socials'](msg,callback);
    },
}

//commands that only a mod can run
const mod_commands = {
    "!mod_only_test":function(msg,callback){
        callback("This command can only be run by a mod");
    },
}

/*=========================
======= End Config ========
==========================*/

const Platforms = {
    twitch:1,
    discord:2, //not yet supported on public release
}
 
function process_message(msg,callback){
    let args = msg.content.split(' ');
    let cmd = args.shift().toLowerCase();
    msg.command = cmd;
    msg.args = args;
    
    console.log(msg);

    if(msg.is_mod || msg.is_owner){
        if(mod_commands[cmd]){
            mod_commands[cmd](msg,callback);
            return;
        }
    }
    if (commands[cmd]){
        commands[cmd](msg,callback);
        return
    }

}

function template_string(str,obj){
    for(let key in obj){
        const needle = '%'+key;
        str = str.split(needle).join(obj[key]);
    }
    return str;
}

// Create a twitch with our options
const twitch = new tmi.client(opts);

// Register our event handlers (defined below)
twitch.on('message', onMessageHandler);
twitch.on('connected', onConnectedHandler);

twitch.on("cheer", (channel, userstate, message) => {
    const bits = userstate.bits;
    twitch.say(channel,template_string(cheerMessage,{
        username:userstate.username,
        bits:userstate.bits
    }))
    console.log(`BITS: ${userstate['username']} - ${userstate.bits}`);
});

twitch.on("giftpaidupgrade", (channel, username, sender, userstate) => {
    subscriptions++;
    io.sockets.emit('set_subscriptions',subscriptions);
});

twitch.on("resub", (channel, username, months, message, userstate, methods) => {
    subscriptions++;
    io.sockets.emit('set_subscriptions',subscriptions);
});

twitch.on("anongiftpaidupgrade", (channel, username, userstate) => {
    subscriptions++;
    io.sockets.emit('set_subscriptions',subscriptions);
});

twitch.on("subscription", (channel, username, method, message, userstate) => {
    subscriptions++;
    io.sockets.emit('set_subscriptions',subscriptions);
});

twitch.on("submysterygift", (channel, username, numbOfSubs, methods, userstate) => {
    subscriptions += numbOfSubs;
    io.sockets.emit('set_subscriptions',subscriptions);
});

//this has been disabled because for some reason twitch started counting normal subs as subgifts and this causes the sub count to increase at twice the rate
//twitch.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => {
    //subscriptions++;
//});

// Connect to Twitch:
twitch.connect();

function log(...args){
    console.log(...args);
}

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {

  if (self) { return; } // Ignore messages from the bot

  if(context.mod){
    log("TWITCH(MOD): "+context['display-name']+':',msg);
  }else{
    log("TWITCH: "+context['display-name']+':',msg);
  }

  const un = context['display-name'].trim();

  process_message({
      content:msg,
      username:un,
      platform:Platforms.twitch,
      is_mod:context.mod,
      is_owner: opts.channels.indexOf('#'+un.toLowerCase()) !== -1,
      subscriber:context.subscriber,
    },function(response){
    twitch.say(target,response)
  })
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
