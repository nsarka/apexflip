'use strict'

const config = require('../config')
const async = require('async')
const fs = require('fs')
const Trade = require('./index')

const SteamUser = require('steam-user')
const SteamCommunity = require('steamcommunity')
const SteamTotp = require('steam-totp')
const TradeOfferManager = require('steam-tradeoffer-manager')
const SteamID = require('steamid');

Trade.prototype.startBots = function startBots(done) {
    const self = this
    let count = 0

    async.eachOfSeries(config.bots, (bot, id, callback) => {
        count += 1
        const client = new SteamUser({
            dataDirectory: null,
        })
        self.instances[id] = {
            client,
            community: new SteamCommunity(),
            manager: new TradeOfferManager({
                steam: client,
                domain: config.domain,
                language: 'en',
                cancelTime: 600000,
            }),
            login: {
                "accountName": bot.accountName,
                "password": bot.password,
                "twoFactorCode": SteamTotp.getAuthCode(bot.twoFactorCode),
            },
            user: bot,
        }
        // identifiers
        self.instances[id].client.bot_id = id
        self.instances[id].community.bot_id = id
        self.instances[id].manager.bot_id = id
        // polldata
        if (fs.existsSync(`./polls/${id}.json`)) {
            self.instances[id].manager.pollData = JSON.parse(fs.readFileSync(`./polls/${id}.json`))
        }
        // personaState
        const LookingToTrade = SteamUser.Steam.EPersonaState.LookingToTrade
        // login
        self.instances[id].client.logOn(self.instances[id].login)
        self.instances[id].client.addListener('webSession', (sessionID, cookies) => {
            self.instances[id].manager.setCookies(cookies, (err) => {
                if (err) {
                    return callback(err)
                }
                return true
            })
            self.instances[id].community.setCookies(cookies)
            self.instances[id].client.setPersona(LookingToTrade, bot.personaName)
        })

        self.instances[id].manager.on('pollData', (data) => {
            fs.writeFile(`./polls/${id}.json`, JSON.stringify(data))
        })
        // authenticated
        console.log(`Bot (${id}) has been logged-in.`)
        if (count >= Object.keys(config.bots).length) {
            return callback()
        }
        console.log('Waiting 30 seconds before authenticating another bot to avoid Steam cooldowns.')
        return setTimeout(() => {
            callback()
        }, 30000)
    }, () => {
        console.log('[!] All bots online.')
        if (typeof done === 'function') {
            done()
        }
    })
}

Trade.prototype.addBotListeners = function addBotListeners() {
    this.botListen('manager', 'newOffer', (offer) => {
        setTimeout(() => offer.decline(), 30000)
    })

    this.botListen('manager', 'sentOfferChanged', (offer, oldState) => {
        console.log(`Offer #${offer.id} changed: ${TradeOfferManager.ETradeOfferState[oldState]} -> ${TradeOfferManager.ETradeOfferState[offer.state]}`);

        if (offer.state == TradeOfferManager.ETradeOfferState.Accepted) {
            offer.getExchangeDetails((err, status, tradeInitTime, receivedItems, sentItems) => {
                if (err) {
                    console.log(`Error ${err}`);
                    return;
                }

                // Create arrays of just the new assetids using Array.prototype.map and arrow functions
                let newReceivedItems = receivedItems.map(item => item.assetid);
                let newSentItems = sentItems.map(item => item.assetid);
                
                console.log(`Received items ${newReceivedItems.join(',')} Sent Items ${newSentItems.join(',')} - status ${TradeOfferManager.ETradeStatus[status]}`)
                console.log(offer.partner)
                
                var sid = new SteamID()
                sid.universe = offer.partner.universe
                sid.type = offer.partner.type
                sid.instance = offer.partner.instance
                sid.accountid = offer.partner.accountid

                var sid64 = sid.getSteamID64()

                this.flipmanager.tradeAccepted(sid64)

                this.io.emit('flip update', {})
            })
        }
    })
}

Trade.prototype.reloadBotSessions = function reloadBotSessions() {
    Object.keys(this.instances).forEach((id) => {
        this.instances[id].client.webLogOn()
    })
}

Trade.prototype.getBot = function getBot(id) {
    return this.instances[id]
}

Trade.prototype.botConfirmation = function botConfirmation(id, offerid, callback) {
    const bot = this.instances[id]
    bot.community.acceptConfirmationForObject(bot.user.identitySecret, offerid, callback)
}

Trade.prototype.botListen = function botListen(obj, listen, fn) {
    Object.keys(this.instances).forEach((id) => {
        this.instances[id][obj].on(listen, fn)
    })
}