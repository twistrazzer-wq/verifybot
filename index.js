require('dotenv').config();

console.log("TOKEN IS:", process.env.TOKEN);
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.get(process.env.SERVER_ID);

  // MEMBER COUNT UPDATE
  const updateMembers = () => {
    const channel = guild.channels.cache.get(process.env.VOICE_CHANNEL_ID);
    if (channel) {
      channel.setName(`👥 Members: ${guild.memberCount}`);
    }
  };

  updateMembers();
  client.on('guildMemberAdd', updateMembers);
  client.on('guildMemberRemove', updateMembers);

  // VERIFY BUTTON
  const verifyChannel = guild.channels.cache.get(process.env.VERIFY_CHANNEL_ID);

  const verifyBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verify')
      .setLabel('✅ Verify')
      .setStyle(ButtonStyle.Success)
  );

  await verifyChannel.send({
    content: "Paspausk verify:",
    components: [verifyBtn]
  });

  // TICKET BUTTON
  const ticketChannel = guild.channels.cache.get(process.env.TICKET_CHANNEL_ID);

  const ticketBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket')
      .setLabel('🎫 Open Ticket')
      .setStyle(ButtonStyle.Primary)
  );

  await ticketChannel.send({
    content: "Spausk jei reikia pagalbos:",
    components: [ticketBtn]
  });
});


// BUTTON INTERACTIONS
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const logChannel = guild.channels.cache.get(process.env.LOG_CHANNEL_ID);

  // VERIFY
  if (interaction.customId === 'verify') {
    const role = guild.roles.cache.get(process.env.VERIFY_ROLE_ID);

    await interaction.member.roles.add(role);
    await interaction.reply({ content: "Patvirtintas ✅", ephemeral: true });

    logChannel.send(`✅ ${interaction.user.tag} verified`);
  }

  // CREATE TICKET
  if (interaction.customId === 'ticket') {
    const channel = await guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionsBitField.Flags.ViewChannel]
        }
      ]
    });

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close')
        .setLabel('❌ Close')
        .setStyle(ButtonStyle.Danger)
    );

    channel.send({
      content: "Support greitai atsakys",
      components: [closeBtn]
    });

    interaction.reply({ content: `Ticket: ${channel}`, ephemeral: true });
  }

  // CLOSE TICKET
  if (interaction.customId === 'close') {
    logChannel.send(`❌ Ticket closed by ${interaction.user.tag}`);
    interaction.channel.delete();
  }
});


// PAYPAL COMMAND
client.on('messageCreate', message => {
  if (message.author.bot) return;

  if (message.content.startsWith("!paypal")) {
    const args = message.content.split(" ");
    const amount = args[1];

    if (!amount) return message.reply("Pvz: !paypal 5");

    const link = `${process.env.PAYPAL_LINK}/${amount}`;

    message.reply(`💸 Mokėk čia:\n${link}`);
  }
});

client.login(process.env.TOKEN);