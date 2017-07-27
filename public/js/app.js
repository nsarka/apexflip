$(function () {
    var app = new Vue({
        el: '#app',
        data: {
            coinflips: [],
            priceList: {},
            rates: {},
            disableReload: true,
            disableTrade: true,

            // user
            userInventory: [],
            userInventorySelected: [],
            userInventorySelectedValue: 0,
            // auth
            user: false,
            // site
            site: {
                header: '',
                steamGroup: '#',
                copyrights: ''
            },
            // trade
            offerStatus: {},
            invalidTradelink: false,

            // Real provable fairness. Other sites don't use a client created seed to generate the hash, making it not actually fair.
            // Generate random 16 character hex code for client seed
            // Look at randomizeClientSeed()
            clientSeed: '',
            serverHash: ''
        },
        methods: {
            setInventorySort: function (value) {
                this.userInventory = this.sortInventory(this.userInventory, value);
            },
            sortInventory: function (inventory, desc) {
                return inventory.sort(function (a, b) {
                    if (desc) {
                        return b.price - a.price;
                    } else {
                        return a.price - b.price;
                    }
                });
            },
            addItem: function (who, id, assetid, price) {
                if (typeof price === 'undefined') {
                    price = assetid;
                    assetid = id;
                }
                if (who == 'user') {
                    var userInventorySelected = this.userInventorySelected;
                    userInventorySelected.push(assetid);
                    this.userInventorySelected = userInventorySelected;
                    this.userInventorySelectedValue += parseFloat(price);
                }
                this.checkTradeable();
            },
            removeItem: function (who, id, assetid, price) {
                if (typeof price === 'undefined') {
                    price = assetid;
                    assetid = id;
                }
                // Clean this later
                if (who == 'user') {
                    this.userInventorySelected.splice($.inArray(assetid, this.userInventorySelected), 1);
                    this.userInventorySelectedValue -= price;

                    if (this.userInventorySelectedValue <= 0) {
                        this.userInventorySelectedValue = 0;
                    }
                }
                this.checkTradeable();
            },
            checkTradeable: function () {
                this.disableTrade = false
            },
            searchInventory: function (who, value) {
                var inventory = [];
                var search = [];
                if (who == 'bot') {
                    search = this.botInventory;
                } else {
                    search = this.userInventory;
                }
                for (var i in search) {
                    var item = search[i];
                    if (item.data.market_hash_name.toLowerCase().indexOf(value.toLowerCase()) === -1) {
                        item.hidden = 1;
                    } else {
                        item.hidden = 0;
                    }
                    inventory.push(item);
                }
                if (who == 'bot') {
                    this.botInventory = sortInventory(inventory, true);
                } else {
                    this.userInventory = sortInventory(inventory, true);
                }
            },
            updateTradelink: function () {
                var link = this.user.tradelink;
                if (typeof link !== 'undefined') {
                    link = link.trim();
                    if (
                        link.indexOf('steamcommunity.com/tradeoffer/new/') === -1 ||
                        link.indexOf('?partner=') === -1 ||
                        link.indexOf('&token=') === -1
                    ) {
                        this.invalidTradelink = true;
                    } else {
                        this.invalidTradelink = false;
                        localStorage.setItem(this.user.id, this.user.tradelink);
                        $('#tradeLinkModal').modal('hide');
                    }
                } else {
                    this.invalidTradelink = true;
                }

            },
            reloadInventories: function () {
                this.disableReload = true;
                this.userInventory = [];
                this.userInventorySelected = [];
                this.userInventorySelectedValue = 0;
                if (this.user && typeof this.user.steamID64 !== 'undefined') {
                    socket.emit('get user inv', this.user.steamID64);
                }
            },
            createFlip: function () {
                if (!localStorage[this.user.id]) {
                    $('#flipModal').modal('hide');
                    $('#tradelink').modal('show');
                } else {
                    this.offerStatus = {};
                    this.checkTradeable();
                    if (!this.disableTrade) {
                        this.disableTrade = true;
                        $('#flipModal').modal('hide');
                        $('#tradeoffer').modal('show');
                        this.randomizeClientSeed();
                        socket.emit('flip offer', {
                            user: this.userInventorySelected,
                            steamID64: this.user.id,
                            tradelink: localStorage[this.user.id],
                            clientSeed: this.clientSeed,
                            name: this.user.displayName,
                            pic: this.user.photos[1].value,
                        });
                        console.log('Offer sent')
                    }
                }
            },
            joinFlip: function () {
                if (!localStorage[this.user.id]) {
                    $('#tradelink').modal('show');
                } else {
                    $('#joinModal').modal('show'); // Create join modal

                    this.offerStatus = {};
                    this.checkTradeable();

                    if (!this.disableTrade) {
                        this.disableTrade = true;
                        $('#flipModal').modal('hide');
                        $('#tradeoffer').modal('show');
                        socket.emit('flip offer', {
                            user: this.userInventorySelected,
                            steamID64: this.user.id,
                            tradelink: localStorage[this.user.id]
                        });
                    }
                }
            },
            cancelFlip: function () {
                this.userInventorySelected = []
            },
            randomizeClientSeed: function () {
                this.clientSeed = Math.floor(Math.random() * (Math.pow(16, 16))).toString(16)
            }
        }
    });

    $(window).on("load", function () {

        /* call mCustomScrollbar function before jquery ui resizable() */

        $(".content").mCustomScrollbar({
        });
    });

    // Sockets
    var socket = io();

    socket.emit('get pricelist');
    socket.emit('get rates');
    socket.emit('get coinflips');

    $('#chatboxsendbutton').submit(function () {
        if (app.user.displayName) {
            if ($('#m').val().length > 0) {
                var msg = {
                    name: app.user.displayName,
                    pic: app.user.photos[1].value,
                    message: $('#m').val()
                }

                socket.emit('chat message', msg);
                $('#m').val('');
            }

            return false;
        } else {
            $('#mCSB_1_container').append($('<p>').html('<hr>'));
            $('#mCSB_1_container').append($('<p>').html('<strong>Log in with Steam to use the chat.</strong>'));
            $('#m').val('');
            $('.content').mCustomScrollbar('scrollTo', 'last');

            return false;
        }
    });

    socket.on('update coinflips', function (coinflips) {
        app.coinflips = Object.assign({}, app.coinflips, coinflips);
    });

    socket.on('flip update', function() {
        socket.emit('get coinflips')
    })

    socket.on('chat message', function (msg) {
        $('#mCSB_1_container').append($('<p>').html("<hr><img src=" + msg.pic + " class='chatpic'><strong> " + msg.name + '</strong>: ' + msg.message));
        $('.content').mCustomScrollbar('scrollTo', 'last');
    });

    socket.on('site', function (data) {
        app.site = data;
        window.document.title = data.header + ' | CS:GO Gambling Evolved';
    });

    socket.on('offer status', function (data) {
        app.offerStatus = data;
        if (data.status === 3 || data.status === false) {
            app.disableTrade = false;
        }

        if(data.status === 2 && data.computedServerHash) {
            app.serverHash = data.computedServerHash
        }

        if (data.status === 3) {
            app.userInventorySelected = [];
            app.userInventorySelectedValue = 0;
        }
    });

    socket.on('user', function (user) {
        user.steamID64 = user.id;
        app.user = user;

        if (app.user.steamID64) {
            socket.emit('get user inv', app.user.steamID64);
        }
    });

    socket.on('user inv', function (data) {
        app.disableReload = false;
        if (!data.error) {
            var userInventory = [];
            for (var i in data.items) {
                var item = data.items[i];
                item.price = (app.priceList[item.data.market_hash_name]).toFixed(2);
                userInventory.push(item);
            }
            if (!userInventory.length) {
                userInventory = { error: { error: 'No tradeable items found.' } };
            } else {
                userInventory = sortInventory(userInventory, true);
            }
            app.userInventory = userInventory;
        } else {
            app.userInventory = data;
        }
    });

    socket.on('pricelist', function (prices) {
        app.priceList = Object.assign({}, app.priceList, prices);
    });

    socket.on('rates', function (rates) {
        app.rates = Object.assign({}, app.rates, rates);
    });

    function sortInventory(inventory, desc) {
        return inventory.sort(function (a, b) {
            return (desc) ? b.price - a.price : a.price - b.price;
        });
    }

});