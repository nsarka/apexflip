'use strict'

module.exports = {
    steamApiKey: '5724FDE13EAACD6BB0CD6238E984A341',    // Your Steam API key, get it here: https://steamcommunity.com/dev/apikey
    SteamApisKey: '2eGArj4s4kTojLTBMaoJk0q3I5c',   // Your SteamApis.com key, get it here: https://steamapis.com

    dbUser: '',    // MongoDB login
    dbPassword: '', // MongoDB password

    bots: {
        bot_1: {
            siteName: 'Bot 1',  // Will be displayed under the "All bots" tab e.g. "Keys Only"
            accountName: 'magn26',    // bot_1 username
            password: '11112321q',       // bot_1  password
            twoFactorCode: 'R+rKeqhbdgJmCdOa64JL+9LxPzU=',  // shared_secret value
            identitySecret: 'Db5EkqUtEsmScmT8mK+D98f6po8=', // identity_secret value
            steamID64: '76561198159926602',  // SteamID64 of bot account can be found here: "https://steamid.io/"
            personaName: 'CsOptic',   // Nickname for bot account, will change on restart
        },
        bot_2: {
            siteName: 'Bot 2',  // Will be displayed under the "All bots" tab e.g. "Keys Only"
            accountName: 'Somebodyelse234',    // bot_1 username
            password: 'Hal83057ndb82bs5',       // bot_1  password
            twoFactorCode: 'FGNmmAWM2vm0LeRToX6ryrc0t8o=',  // shared_secret value
            identitySecret: 'DCA6unoWiRdMGqL6XbRrLgjl1BE=', // identity_secret value
            steamID64: '76561198401956045',  // SteamID64 of bot account can be found here: "https://steamid.io/"
            personaName: 'CsOptic2',   // Nickname for bot account, will change on restart
        },
    },

    site: {
        header: 'CsOptic.com', // Name/header/title of website. Prefix for  <title></title> (For more: /index.html line: 9) 
        steamGroup: '#',
        copyrights: 'Copyright © CsOptic.com 2017',  // Copyright text
    },

    domain: 'localhost',    // Domain name only, follow the example (no http:// & no www & no /)
    website: 'http://localhost',    // Website URL, follow the example (do not add / at the end)
    websitePort: 80,    // Website PORT, don't change it unless you're using a reverse proxy
    tradeMessage: 'Trade offer from CsOptic | If you did not request this offer or the offer looks invalid please decline.', // Quite obvious
    
    rates: {
        ignoreItemsBelow: 0.01, // Ignore items below this price (price * rate < ignoreItemsBelow) - shows (Too Low) for user
    }
}