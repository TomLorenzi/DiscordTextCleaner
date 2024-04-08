const Sequelize = require('sequelize');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Message } = require('discord.js');
const { clientId, token } = require('./config.json');

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const sequelize = new Sequelize('database', 'user', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	// SQLite only
	storage: 'database.sqlite',
});

const Channels = sequelize.define('channels', {
    channel_id: {
        type: Sequelize.STRING,
        primaryKey: true,
    },
    guild_id: Sequelize.STRING,
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, readyClient => {
    Channels.sync();
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    const channel = await checkIfChannelExists(message.channel.id);
    if (!channel) return;

    const isValid = await checkIfIsValidMessage(message);
    if (isValid) return;

    await message.delete();
});

const checkIfChannelExists = async (channel_id) => {
    const channel = await Channels.findOne({ where: { channel_id } });
    return channel;
};

const checkIfIsValidMessage = async (message) => {
    if (message.attachments.size > 0) return true;
    if (message.content.includes('http')) return true;

    return false;
};

// Login to Discord with your client's token
client.login(token);