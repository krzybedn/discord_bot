const Discord = require('discord.js');
const fs = require('fs');
const yt = require('ytdl-core');
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {};


var voiceChannel = null;
var textChannel = null;
var myDispatcher = new MyEmitter();
var currentPlaying = null;
var info = null;
var length = 0;
var	queue = [];


function play(){
	currentPlaying = queue[0].url;
	info=queue[0].info;
	voiceChannel=queue[0].vChannel;
	textChannel=queue[0].tChannel;
	queue.shift();
	textChannel.send("Now playing: " + info.title + " by "+ info.author + "(" + Math.floor(info.length/60) + ":" + info.length%60 +")" );
	voiceChannel.join()
		.then(connnection => {
			stream = yt(currentPlaying, {audioonly: true});	
			myDispatcher = connnection.playStream(stream);
			myDispatcher.setVolume(0.2);
			myDispatcher.on('end', reason => {
				if(queue.length==0)
				{
					textChannel.send("Finished music queue");
					currentPlaying=null;
					voiceChannel.leave();
					voiceChannel=null;
					length=0;
				}
				else
				{
					length-=parseInt(queue[0].info.length);
					play();
				}


				console.log(reason);
			});
			myDispatcher.on('error', (err) => {
				console.log("ERROR!!! Music player\n" + err + "\n\n");

			})
		});
}

var commands={
	"play":{
		description: "Play a music from given URL.",
		process: function (msg, splited)
		{
			var url;
			if (!msg.member.voiceChannel) 
			{
				return msg.reply("Please be in a voice channel first!").catch(function(reason){fail(reason, msg)});
			}
			if(splited.length == 1)
				url = "https://www.youtube.com/watch?v=YdWo5zbbGnY";//"https://www.youtube.com/watch?v=dQw4w9WgXcQ";
			else 
				url=splited[1];
			
			yt.getInfo(url, function (err, info) {
				if (err) {
					msg.channel.send("Sory, I couldn't add that track.");
					console.log("ERROR!!! Track opening: " + msg + err);
					return;
				}
				else{
					var short_info = {
						"title": info.title,
						"author": info.author.name,
						"length": info.length_seconds
					};
					queue.push({"url":url,"info": short_info, "vChannel": msg.member.voiceChannel, "tChannel": msg.channel});
					if(currentPlaying === null)
					{
						play();
					}
					else
					{
						msg.channel.send("Added to queue: " + short_info.title + " by "+ short_info.author + "(" + Math.floor(short_info.length/60) + ":" + 	short_info.length%60 +")" );
						length+=parseInt(short_info.length);
					}
				}
			});
		}
	},
	"stop":{	
		description: "Stops the player.",
		process: function(msg, splited)
		{
			if(splited.length!=1)
			{
				return msg.channel.send("`stop` don't need any arguments");;
			}
			if(voiceChannel==null)
			{
				msg.channel.send("I can't exit voice channel when I'm not on any of it");
			}
			else{
				try
			{
				queue=[];
				length=0;
				myDispatcher.end();
			}
			catch(reason)
			{console.log("ERROR STOP!!!: " + msg +  reason);};}
		}	
	},
	"skip":{
		description: "Skip current track.",
		process: function(msg, splited)
		{
			if(splited.length!=1)
			{
				return msg.channel.send("`skip` don't need any arguments");;
			}
			if(voiceChannel==null)
			{
				msg.channel.send("I can't skip track when I don't play any.");
			}
			else{
				try
			{
				msg.channel.send("Skipping: " + info.title + " by "+ info.author + "(" + Math.floor(info.length/60) + ":" + 	info.length%60 +")" );
				myDispatcher.end();
			}
			catch(reason)
			{console.log("ERROR SKIP!!!: " + msg+ "----" +  reason);};}
		}	
	},
	"queue":{
		description: "Show queue of player",
		process: function(msg, splited)
		{
			if(splited.length!=1)
			{
				return msg.channel.send("Command `queue` don't need any arguments");;
			}
			if(queue.length == 0)
			{
				return msg.channel.send("Queue is empty.");
			}
			const embed = new Discord.RichEmbed()
			.setTitle("_*QUEUE*_")
			.setColor('#284684')
			.setDescription("Tracks in queue: " + queue.length + "  (" + Math.floor(length/60) + ":" + 	length%60 + ")")
			.setFooter('For: '+msg.author.username, msg.author.avatarURL)
			.setTimestamp();
			for(var i=0; i<queue.length; i++)
			{
				embed.addField("*" + (i+1) +".*  " + queue[i].info.title," by "+ queue[i].info.author + "(" + Math.floor(queue[i].info.length/60) + ":" + 	queue[i].info.length%60 +")" );
			}
			msg.channel.sendEmbed(embed);
			
		}
	},
	"time":{
		description: "Show time to end of curent track",
		process: function(msg, splited)
		{
			if(currentPlaying)
			{
				var time_left = info.length - myDispatcher.time/1000;
				msg.channel.send(
					"Time left to the end of track: " +
					Math.floor(time_left/60) + ":" + Math.floor(time_left%60));
			}
			else 
			{
				return msg.channel.send("Currently there's no music playing");
			}
		}
	}
}

exports.help = function(msg) {
	var sortedCommands = Object.keys(commands).sort();
	const embed = new Discord.RichEmbed()
		.setTitle("_*MUSIC COMMANDS*_")
		.setColor('#284684')
		.setFooter('For: '+msg.author.username, msg.author.avatarURL)
		.setTimestamp();
	for(var i in sortedCommands)
	{
		var command=sortedCommands[i];
		embed.addField(command, commands[command].description);
	}
	msg.channel.sendEmbed(
		embed,
		{ disableEveryone: true }
		).catch(function(reason){fail(reason, msg)
	});
}
exports.commands=commands;