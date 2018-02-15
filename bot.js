const Discord = require('discord.js');
const mybot = new Discord.Client();
const settings = require('./settings.json');
const music = require('./music.js');

const request = require('request');
const gm = require('gm').subClass({imageMagick: true});

const fs = require('fs');



var commands = {
	"ping":{
		description: "Pong!",
		process: function(msg, splited) 
		{
			var time = new Date().getTime() - msg.createdTimestamp;
			msg.reply('Pong!  ' + time).catch(function(reason){fail(reason, msg)});
		}
	},
	"prefix":{
		description: "Change charcters which each commands starts with.",
		process: function(msg, splited)
		{
			if(splited.length != 2)
			{
				msg.reply("`prefix` command must acquire exacly one string as argument").catch(function(reason){fail(reason, msg)});
			}
			else
			{
				var new_prefix=splited[1];
				msg.reply('Prefix has been changed to ' + new_prefix).catch(function(reason){fail(reason, msg)});
				var parsedJson = JSON.parse(fs.readFileSync('settings.json').toString());
				settings.prefix = new_prefix;
				parsedJson.prefix = new_prefix;
				fs.writeFile("settings.json", JSON.stringify(parsedJson), (err)=>
				{
					if(err)
					{
						console.log("ERROR with prefix saving: " + err);
						exit;
					}
				});	
			}
		}
	},
	"help":{
		description: "Show list of commands you can use.",
		process: function(msg, splited)
		{
			var sortedCommands = Object.keys(commands).sort();
			const embed = new Discord.RichEmbed()
			.setTitle("_*__**COMMANDS**__*_")
			.setColor('#284684')
			.setFooter('For: '+msg.author.username, msg.author.avatarURL)
			.setTimestamp();
			for(var i in sortedCommands)
			{
				var command=sortedCommands[i];
				embed.addField(command, commands[command].description);
			}
			msg.channel.send(
				{ embed }
			).catch(function(reason){fail(reason, msg)});
		}
	},
	"music":{
		description: "Menagment of music player",
		process: function(msg, splited)
		{
			splited.shift();
			if(splited.length == 0)
			{
				music.help(msg);
			}
			else 
			{
				var com=music.commands[splited[0]];
				if(!com)
				{
					console.log("ERROR!!!! Nieprawidłowa komenda " + msg.author.username + " - " + msg.content);
					msg.reply("I don't know that command").catch(function(reason){fail(reason, msg)});
				}
				else if(splited.length == 2 && splited[1] === "help")
				{
					msg.channel.send("**" + splited[0] + "**: " + com.description)
						.catch(function(reason){fail(reason, msg)});
				}
				else
				{
					com.process(msg, splited);
				}
			}
		}
	},
	"rand":{
		description: "Rand a number smaller or equal the given.",
		process: function(msg, splited)
		{
			if(splited.length != 2 || isNaN(splited[1]) || splited[1]<0)
			{
				msg.channel.send("\'rand\' command must acquire exacly one number as argument").catch(function(reason){fail(reason, msg)});
			}
			else
			{
				msg.channel.send(Math.floor((Math.random() * splited[1]) +1)).catch(function(reason){fail(reason, msg)});
			}
		}
	},
	"say":{
		description: "Saying something using tts",
		//error: Function `say` need minimum one character as argument",
		process: function(msg, splited)
		{
			if(splited.length==1)
			{
				msg.channel.send("ERROR!!! Function `say` need minimum one character as argument");
				console.log("Błąd funkcji say: " +  msg.author.username + " - " + msg.content);
				return;
			}
			var text="";
			for(var i=1; i<splited.length; i++)
				text+=splited[i];
			msg.channel.send(text, {"tts":1})
				.then(answer => {answer.delete(1000);})
				.catch(function(reason){fail(reason, msg)});
			msg.delete(1000).catch(reason => {console.log("--"+reason)});
		}
	},
	"tex":{
		description: "Convert latex to picture",
		process: function(msg, splited)
		{
			if(splited.length == 1)
			{
				msg.channel.send("ERROR!!! Function `tex` need minimum one character as argument");
				console.log("Błąd funkcji tex: " +  msg.author.username + " - " + msg.content);
				return;
			}
		var formula = "";
		for(var i = 1; i<splited.length; i++)
			formula += " " + splited[i];

		formula = formula.replace(/%/g,"%25");
		formula = formula.replace(/&/g,"%26");

		var body = "formula=" + formula;
		body += "&fsize=26px";
		body += "&fcolor=f0f0f0";
		body += '&mode=0';
		body += '&out=1&remhost=quicklatex.com';
		body += '&preamble=\\usepackage{amsmath} \\usepackage{amsfonts} \\usepackage{amssymb}';


		request.post('http://quicklatex.com/latex3.f', {body: body},
			function (error, response, body) {
				var result = body.match(/^([-]?\d+)\r\n(\S+)\s([-]?\d+)\s(\d+)\s(\d+)\r?\n?([\s\S]*)/);
				
				var status = result[1];
				var imgurl = result[2];
				var valign = result[3];
				var imgw   = parseInt(result[4])+4;
				var imgh   = parseInt(result[5])+4;
				var errmsg = result[6];

				if(status == 0)
				{
					
					gm(imgw, imgh, "#36393E").write("back.png", function(err){
						if(err)
							console.log(err);
						else gm(request(imgurl)).write("front.png", function(err){
							if(err) 
								console.log(err)
							else
								gm("back.png").composite("front.png").gravity("Center").write("all3.png", function(err){
									if(err)
										console.log(err)
									else
									{
										msg.channel.send({files: ["all3.png"]});
										console.log("Succesful posted image: " + imgw + " " + imgh);
									}
					
						});});});

				}
				else
					msg.channel.send("Image")
					console.log(errmsg);
			});
		}
	}
}





mybot.on('message', msg => 
{
	if(msg.content === "<@" + mybot.user.id + "> prefix")//tajna funkcja dla inteligentnych
	{
		msg.reply('Prefix is ' + settings.prefix).catch(function(reason){fail(reason, msg)});
		console.log(msg.author.username + " - " + msg.content);
		msg.delete()
		 .then(message => console.log("Deleted message from {" + message.author.username + "}"))
		 .catch(console.error);
	}
	var splited=[""];	
	
	if(msg.content.startsWith(settings.prefix))
	{
		console.log(msg.author.username + " - " + msg.content);
		splited = msg.content.split(" ");
		splited[0]=splited[0].slice(settings.prefix.length);
		var com=commands[splited[0]];
		if(!com)
		{
			console.log("ERROR!!!! Nieprawidłowa komenda " + msg.author.username + " - " + msg.content);
			msg.reply("I don't know that command").catch(function(reason){fail(reason, msg)});
		}
		else if(splited.length >=2 && splited[1] === "help")
		{
			msg.channel.send("**" + splited[0] + "**: " + com.description)
				.catch(function(reason){fail(reason, msg)});
		}
		else
		{
			com.process(msg, splited);
		}
	}	
});

process.on("unhandledRejection", err => {
  console.error("Uncaught Promise Error: \n" + err.stack);
});

function fail(reason, msg)
{	 
	msg.reply("I couldn\'t send an aswer because of ").catch(console.error);
	console.log("ERROR!!!!" + msg.author.username + " - " + msg.content);
};


mybot.on("error", error=>
{
	console.log("Connection error" + error);
	if(music.voiceChannel==null)
			{
				msg.channel.send("I can't exit voice channel when I'm not on any of it");
			}
});

mybot.on('ready', () => {
	mybot.user.setGame("Some game!!")
		.then(user => console.log("Game has been set!"))
		.catch(console.error);
	var channel = mybot.channels.find("name", "general"); 

	var guilds = mybot.guilds;
	guilds.forEach(function(elem){
		console.log(elem.id + " " + elem.name);
	});
	
	console.log("I am ready");
	channel.send('**Ready!!**');
	
});

mybot.login(settings.token);	
