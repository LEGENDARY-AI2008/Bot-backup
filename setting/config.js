const fs = require('fs')

global.owner = "234" //owner number
global.footer = "Axis XMD" //footer section
global.status = false //"self/public" section of the bot
global.prefa = ['','!','.',',','🐤','🗿']
global.owner = ['62']
global.xprefix = '.'
global.gambar = "https://files.catbox.moe/1ntiwc.jpg"
global.OWNER_NAME = "@KallmeTrust" //
global.DEVELOPER = ["09056760155"] //
global.BOT_NAME = "Λ𝗫𝗜𝗦 𝗫𝗠𝗗"
global.bankowner = "Λ𝗫𝗜𝗦 𝗫𝗠𝗗"
global.creatorName = "Λ𝗫𝗜𝗦 Ł𝗮𝗯𝘀™"
global.ownernumber = '09056760155'  //creator number
global.location = "Nigeria,lagos island"
global.prefa = ['','!','.','#','&']
//================DO NOT CHANGE OR YOU'LL GET AN ERROR=============\
global.footer = "Axis XMD" //footer section
global.link = "https://chat.whatsapp.com/GtVgGTFN8t52sAHaR4XAwq"
global.autobio = true//auto update bio
global.botName = "Λ𝗫𝗜𝗦 𝗫𝗠𝗗"
global.version = "1.0.1"
global.botname = "Λ𝗫𝗜𝗦 𝗫𝗠𝗗"
global.author = "Λ𝗫𝗜𝗦 Ł𝗮𝗯𝘀™"
global.themeemoji = "🥷"
global.wagc = 'https://chat.whatsapp.com/GtVgGTFN8t52sAHaR4XAwq'
global.thumbnail = 'https://files.catbox.moe/1ntiwc.jpg'
global.richpp = ' '
global.packname = "Sticker By Λ𝗫𝗜𝗦 𝗫𝗠𝗗"
global.author = "Λ𝗫𝗜𝗦 Ł𝗮𝗯𝘀™"
global.creator = "09056760155@s.whatsapp.net"
global.antispam = "120363406376026638@newsletter";
global.ownername = 'Great ' 
global.onlyowner = `Only Violet dev can use this Command 🥶🥷`
  // reply 
global.database = `*To Exist In The Database Contact The Owner of this bot*`
  global.mess = {
wait: "*Configurating.......*",
   success: "*Successfully acknowledged ☑️*",
   on: "*Activated ✅*", 
   prem: "*Feature For Premium Users only*", 
   off: "*Deactivated 📛*",
   query: {
       text: "*Please, Provide A Text Query 📑*",
       link: "Please, provide a valid link 🔗*",
   },
   error: {
       fitur: "*Status 🌐: Feature Or Command error ❌*",
   },
   only: {
       group: "*Group only feature ❌*",
private: "*Private chat feature only ❌*",
       owner: "*Owner feature only ❌*",
       admin: "*bot owner feature only ❌*",
       badmin: "*Seek admin privilege's to use this command ❌*",
       premium: "*Availabe for premium users only ❌*",
   }
}

global.hituet = 0
//false=disable and true=enable
global.autoviewstatus = false
global.autoread = false //auto read messages
global.autobio = true //auto update bio
global.anti92 = true //auto block +92 
global.autoswview = true //auto view status/story

let file = require.resolve(__filename)
require('fs').watchFile(file, () => {
  require('fs').unwatchFile(file)
  console.log('\x1b[0;32m'+__filename+' \x1b[1;32mupdated!\x1b[0m')
  delete require.cache[file]
  require(file)
})

//Property of Violetkingdev  
//owner number:+09056760155
//telegram :@VIOLETKINGDEV
