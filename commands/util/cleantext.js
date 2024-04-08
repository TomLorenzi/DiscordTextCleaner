const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleantext')
		.setDescription('Clean tout le texte du channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        const channel = interaction.channel;
        const messages = await channel.messages.fetch({ limit: 100 });
        messages.forEach(async message => {
            if (message.attachments.size === 0 && !message.content.includes('http')) {
                await message.delete();
            }
        });
		await interaction.reply({content: 'Le texte a été nettoyé !', ephemeral: true});
	},
};