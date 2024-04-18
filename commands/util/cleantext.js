const { SlashCommandBuilder, PermissionFlagsBits, Collection } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cleantext')
		.setDescription('Clean tout le texte du channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const channel = interaction.channel;
        const messages = await fetchMore(channel, 1000);
        for (const message of messages.values()) {
            if (message.attachments.size === 0 && !message.content.includes('http')) {
                await message.delete();
            }
        }
		await interaction.editReply('Texte nettoyé !');
	},
};

async function fetchMore(channel, limit = 250) {
    if (!channel) {
        throw new Error(`Expected channel, got ${typeof channel}.`);
    }
    if (limit <= 100) {
        return channel.messages.fetch({ limit });
    }

    let collection = new Collection();
    let lastId = null;
    let options = {};
    let remaining = limit;

    while (remaining > 0) {
        options.limit = remaining > 100 ? 100 : remaining;
        remaining = remaining > 100 ? remaining - 100 : 0;

        if (lastId) {
        options.before = lastId;
        }

        let messages = await channel.messages.fetch(options);

        if (!messages.last()) {
        break;
        }

        collection = collection.concat(messages);
        lastId = messages.last().id;
    }

    return collection;
}