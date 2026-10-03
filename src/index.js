require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const required = [
  "DISCORD_TOKEN",
  "GUILD_ID",
  "EULA_ROLE_ID",
  "LOG_CHANNEL_ID"
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in .env`);
    process.exit(1);
  }
}

const LOCKED_GUILD_ID = "1520573640989479002";

const EULA_URL =
  "https://drive.google.com/file/d/1mR-ZO-g9CzEy6XDqcXE9agG15NMA010Z/view?usp=sharing";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  new SlashCommandBuilder()
    .setName("eula")
    .setDescription("Manage the End Events EULA")
    .addSubcommand(sub =>
      sub
        .setName("setup")
        .setDescription("Post the End Events EULA acceptance panel")
    )
    .addSubcommand(sub =>
      sub
        .setName("status")
        .setDescription("Check whether a member has accepted the EULA")
        .addUserOption(option =>
          option
            .setName("member")
            .setDescription("The member to check")
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("revoke")
        .setDescription("Remove a member's EULA Accepted role")
        .addUserOption(option =>
          option
            .setName("member")
            .setDescription("The member")
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON()
];

function buildPanel() {
  const embed = new EmbedBuilder()
    .setTitle("📜 END EVENTS — PARTICIPANT AGREEMENT")
    .setDescription(
      [
        "Before participating in **End Events**, you must read and agree to the Participant Agreement & Server EULA.",
        "",
        "**Step 1:** Read the EULA completely.",
        "**Step 2:** Click **I Agree** to confirm your acceptance.",
        "",
        "By clicking **I Agree**, you confirm that you have read, understood, and agreed to the terms contained in the End Events Participant Agreement & Server EULA.",
        "",
        "If you do not agree to the terms, do not participate in End Events."
      ].join("\n")
    )
    .setFooter({ text: "End Events • Participant Agreement & Server EULA" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View EULA")
      .setEmoji("📄")
      .setStyle(ButtonStyle.Link)
      .setURL(EULA_URL),
    new ButtonBuilder()
      .setCustomId("eula_accept")
      .setLabel("I Agree")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(
    Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
    { body: commands }
  );
  console.log("Registered /eula commands.");
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Hard lock: End Events is the only server this bot is allowed to operate in.
  const guilds = client.guilds.cache;
  for (const guild of guilds.values()) {
    if (guild.id !== LOCKED_GUILD_ID) {
      console.log(`Leaving unauthorized server: ${guild.name} (${guild.id})`);
      try {
        await guild.leave();
      } catch (error) {
        console.error(`Failed to leave unauthorized server ${guild.id}:`, error);
      }
    }
  }

  if (!client.guilds.cache.has(LOCKED_GUILD_ID)) {
    console.error("The bot is not in the locked End Events server. No commands will be registered.");
    return;
  }

  await registerCommands();
});

client.on("guildCreate", async guild => {
  if (guild.id === LOCKED_GUILD_ID) {
    console.log(`Joined authorized server: ${guild.name}`);
    await registerCommands();
    return;
  }

  console.log(`Rejecting unauthorized server: ${guild.name} (${guild.id})`);
  try {
    await guild.leave();
  } catch (error) {
    console.error(`Failed to leave unauthorized server ${guild.id}:`, error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    // Absolute server lock: ignore every interaction outside End Events.
    if (interaction.guildId !== LOCKED_GUILD_ID) return;
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName !== "eula") return;

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: "❌ You need **Manage Server** permission to use this command.",
          ephemeral: true
        });
      }

      const sub = interaction.options.getSubcommand();

      if (sub === "setup") {
        await interaction.channel.send(buildPanel());
        return interaction.reply({
          content: "✅ EULA panel posted.",
          ephemeral: true
        });
      }

      const member = interaction.options.getMember("member");

      if (!member) {
        return interaction.reply({
          content: "❌ I couldn't find that member in this server.",
          ephemeral: true
        });
      }

      if (sub === "status") {
        const accepted = member.roles.cache.has(process.env.EULA_ROLE_ID);
        return interaction.reply({
          content: accepted
            ? `✅ ${member} has accepted the End Events EULA.`
            : `❌ ${member} has not accepted the End Events EULA.`,
          ephemeral: true
        });
      }

      if (sub === "revoke") {
        if (!member.roles.cache.has(process.env.EULA_ROLE_ID)) {
          return interaction.reply({
            content: `ℹ️ ${member} does not currently have the EULA Accepted role.`,
            ephemeral: true
          });
        }

        await member.roles.remove(
          process.env.EULA_ROLE_ID,
          `EULA acceptance revoked by ${interaction.user.tag}`
        );

        return interaction.reply({
          content: `✅ Removed the EULA Accepted role from ${member}.`,
          ephemeral: true
        });
      }
    }

    if (interaction.isButton() && interaction.customId === "eula_accept") {
      const member = interaction.member;

      if (member.roles.cache.has(process.env.EULA_ROLE_ID)) {
        return interaction.reply({
          content: "✅ You have already accepted the End Events EULA.",
          ephemeral: true
        });
      }

      await member.roles.add(
        process.env.EULA_ROLE_ID,
        "Accepted End Events Participant Agreement & Server EULA"
      );

      const logChannel = await client.channels.fetch(process.env.LOG_CHANNEL_ID);

      if (logChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setTitle("✅ EULA Accepted")
          .setDescription(`${member} has accepted the End Events Participant Agreement & Server EULA.`)
          .addFields(
            { name: "Discord User", value: `${member.user.tag}`, inline: true },
            { name: "User ID", value: member.id, inline: true },
            { name: "Accepted At", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      return interaction.reply({
        content: "✅ **EULA accepted.** You have been given the EULA Accepted role.",
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(error);

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Something went wrong. Please contact End Events staff.",
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
