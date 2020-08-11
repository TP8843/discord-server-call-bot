require('dotenv').config()
const { Client, User } = require('discord.js')

const client = new Client()
const TOKEN = process.env.TOKEN

let currentCalls = []

client.login(TOKEN)

client.on('ready', () => {
  console.info(`Logged in as ${client.user.tag}!`)
})

client.on('message', async (msg) => {
  try {
    if (msg.content.startsWith('.call')) {
      // Checks if message is from a DM
      if (!msg.guild) {
        msg.channel.send(
          'You cannot call people from your direct messages. Please try while connected to a voice channel in a server'
        )
        await message.delete(5000)
        return
      }

      // Checks if a user was mentioned
      if (!msg.mentions.users.size) {
        const botServerMessage = await msg.channel.send(
          'Please tag a valid user!'
        )
        await deleteMessages(botServerMessage, msg, 10000)
        return
      }

      // Initialize variables
      const author = msg.member
      const vc = author.voiceChannel

      // Checks if author is in voice channel
      if (!vc) {
        const botServerMessage = await msg.channel.send(
          'Please enter a voice channel to call someone'
        )
        await deleteMessages(botServerMessage, msg, 10000)
        return
      }

      const taggedUsers = msg.mentions.users.array()

      taggedUsers.forEach(async (taggedUser) => {
        // Checks if mentioned user is a bot
        if (taggedUser.bot) {
          var botServerMessage = await msg.channel.send(
            'You cannot call a bot into the voice channel'
          )
          botServerMessage.delete(10000)
          return
        }

        // Checks if user is already connected to the voice channel
        if (vc.members.array().find((member) => member.id === taggedUser.id)) {
          var botServerMessage = await msg.channel.send(
            `**${taggedUser.username}** is already connected to **${vc.name}**`
          )
          botServerMessage.delete(10000)
          return
        }

        var botServerMessage = await msg.channel.send(
          `Calling ${taggedUser.username}`
        )
        botServerMessage.delete(10000)

        // Allows a message to be sent in the DM
        const customMessage = msg.content.split(`-m `)[1]
        if (customMessage) {
          var initialMessage = await taggedUser.send(
            `You are being called to **${vc.name}** in **${msg.guild}**: ${customMessage}`,
            { tts: true }
          )
        } else {
          var initialMessage = await taggedUser.send(
            `You are being called to **${vc.name}** in **${msg.guild}**`,
            { tts: true }
          )
        }

        // Adds to array of people called but who have not joined yet
        currentCalls.push({
          id: taggedUser.id,
          guild: msg.guild.id,
          vc: vc.id,
          message: initialMessage,
        })

        // Repeatedly pings someone so they notice it
        // for (i = 0; i <= 5; i++) {
        //   if (
        //     !currentCalls.find((call) => ({ id, guild, vc }) =>
        //       vc === vc.id &&
        //       id === taggedUser.id &&
        //       guild === vc.guild.id
        //     )
        //   ) {
        //     break
        //   }

        //   let message = await taggedUser.send(`Calling`)
        //   await message.delete()
        //   message = await taggedUser.send(`Calling`)
        //   await message.delete(1400)
        // }

        // Deletes user and bots messages from server
      })
      msg.delete()
    } else if (msg.content.startsWith('.wipe')) {
      msg.channel.fetchMessages().then((messages) => {
        messages.array().forEach((message) => {
          message.author.equals(client.user) && message.delete()
        })
      })
    }
  } catch (err) {
    console.log(err)
  }
})

client.on('voiceStateUpdate', async (oldUser, newUser) => {
  let newUserChannel = newUser.voiceChannel,
    oldUserChannel = oldUser.voiceChannel

  // User joined voice channel
  if (oldUserChannel === undefined && newUserChannel !== undefined) {
    // Checks if user who entered was being called
    const enteredVC = currentCalls.findIndex(
      ({ id, guild, vc }) =>
        vc === newUser.voiceChannelID &&
        id === newUser.id &&
        guild === newUser.voiceChannel.guild.id
    )

    if (currentCalls[enteredVC]) {
      const callCompleted = currentCalls[enteredVC]
      await callCompleted.message.delete()

      // Remove entry from current calls since they enter voice chat
      currentCalls = currentCalls.filter(
        ({ id, guild, vc }) =>
          vc !== newUser.voiceChannel.id ||
          id !== newUser.id ||
          guild !== newUser.voiceChannel.guild.id
      )
    }
  }
})

const deleteMessages = async (botServerMessage, msg, time = 5000) => {
  msg.delete(time)
  await botServerMessage.delete(time)
}
