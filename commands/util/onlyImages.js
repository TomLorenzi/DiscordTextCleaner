const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Sequelize = require('sequelize');

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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('onlyimages')
		.setDescription('Mettre le channel en image/vidéos seulement')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        const guild_id = interaction.guild.id;
        const channel_id = interaction.channel.id;
        const channel = await Channels.findOne({ where: { channel_id } });
        if (channel) {
            await Channels.destroy({ where: { channel_id } });
            await interaction.reply('Restriction OFF !');
            return;
        }
        await Channels.create({
            channel_id,
            guild_id,
        });
		await interaction.reply('Restriction ON!');
	},
};