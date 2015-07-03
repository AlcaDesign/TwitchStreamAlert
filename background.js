var client_id = 'gt4qqfogemj2wsss2nptmtss5wzwri0',
	twitchAPIDB = {},
	
	streamChannel = ['brownman'],
	playSoundOnNotification = false,
	
	notifs = {},
	lastCheckedWas = {},
	checkTimeout = {},
	
	temporaryList = [],
	
	notify = _.debounce(function(chan, stream) {
			var list = temporaryList,
				notificationID = null,
				notificationOptions = {
						type: 'list',
						iconUrl: 'images/GlitchIcon_WhiteonPurple.png',
						title: 'Channels are now streaming!',
						message: '',
						buttons: [
								{
										title: 'Go to options',
									},
								{
										title: 'Open following',
									}
							],
						priority: 2
					},
				notificationCallback = false;
			temporaryList = [];
			if(list.length <= 1) {
				notificationID = format('alcastreaming-%chan%', { chan: chan });
				_.extend(notificationOptions, {
						type: 'image',
						iconUrl: (stream.channel || {}).logo || 'images/GlitchIcon_WhiteonPurple.png',
						title: format('%channel% is now streaming!', { channel: (stream.channel || {}).display_name || chan }),
						message: (stream.channel || {}).status || '',
						contextMessage: format('Playing %game%', { game: stream.game || 'some games' }),
						buttons: [
								{
										title: 'Go to options',
									},
								{
										title: 'Watch now',
									}
							],
						imageUrl: (stream.preview || {}).large
					});
				notificationCallback = function(notifID) {
						notifs[notifID] = {
								type: 'streamNowLive',
								chan: chan,
								actions: [
										'openOptions',
										'watchNow'
									]
							}
						playNotificationSound();
					};
			}
			else if(list.length >= 2) {
				var l = [];
				for(var i in list) {
					l.push({
							title: (list[i].stream.channel || {}).display_name || list[i].chan,
							message: (list[i].stream.channel || {}).status || list[i].stream.game || ''
						});
				}
				_.extend(notificationOptions, {
						items: l
					});
				notificationCallback = function(notifID) {
						notifs[notifID] = {
								type: 'multipleLive',
								chan: chan,
								actions: [
										'openOptions',
										'openFollowing'
									]
							}
						playNotificationSound();
					};
			}
			console.log(notificationOptions);
			chrome.notifications.create(notificationID, notificationOptions, notificationCallback);
		}, 1000*3);

function playNotificationSound() {
	if(playSoundOnNotification) {
		var audio = new Audio;
		audio.src = 'sounds/AchievementUnlocked.mp3';
		audio.play();
	}
}

function format(text, context) {
	if(_.isUndefined(text)) return '';
	if(typeof context !== 'object') context = window;
	var params = /%(\w+)%/g;
	return text.replace(params, function(match, param, offset, string) {
			if(_.has(context, param)) return context[param];
			return match;
		});
}

function get(uri, data, headers, method, cb, json) {
	return $.ajax({
			url:		uri || '',			data:		data || {},
			headers:	headers || {},		type:		method || 'GET',
			dataType:	json != true ? json : 'jsonp',
			success:	cb || function() { console.log('success', arguments) },
			error:		cb || function() { console.log('error', uri, arguments) }
		});
}

function twitchGet(endpoint, d, data, cb, authToken, failAnyways) {
	var ep = _.where(twitchAPIDB, { name: endpoint, auth: authToken !== undefined && authToken !== '' && authToken }),
		headers = { Accept: 'application/vnd.twitchtv.v3+json', };
	_.extend(data, { client_id: client_id });
	if(authToken) _.extend(headers, { Authorization: 'OAuth ' + authToken });
	if(ep.length > 0) {
		ep = ep[0];
		return get(format('https://api.twitch.tv/kraken/%endpoint%', { endpoint: format(ep.path, d) }), data, headers, ep.method, function(data, textStatus, jqXHR) {
					if(!failAnyways && ((ep.failAt404 && jqXHR.status == 404) || (ep.mustBe200 && jqXHR.status != 200))) {
						var reason = '';
						if(ep.failAt404 && jqXHR.status == 404)
							reason += '(failed at 404 status)';
						if(ep.mustBe200 && jqXHR.status != 200)
							reason += '(status wasn\'t 200)';
						console.log('failed', reason, textStatus, jqXHR.status, data);
						return false;
					}
					(cb || function(data, textStatus, jqXHR) { console.log('twitchGet', textStatus, data) })(data, textStatus, jqXHR);
				}, 'json');
	}
}

function getStream(chan, cb) {
	return twitchGet('channelStream', { channel: chan }, {}, cb || function() {});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if(request.type == 'custom') {
			
			var reqAPI = request.api;
			
			if(_.isArray(reqAPI)) {
				var deferreds = [],
					allData = {};
				for(var i in reqAPI) {
					var apiReq = reqAPI[i];
					(function(apiReq) {
							deferreds.push(twitchGet(apiReq.endpoint || '', apiReq.d || {}, apiReq.data || {}, apiReq.cb || function(customData) { allData[apiReq.name || apiReq.endpoint] = customData; }, apiReq.authToken || false, true));
						})(apiReq);
				}
				$.when.apply($, deferreds).then(function() {
						sendResponse(allData);
					}, function() {
						sendResponse(allData);
					});
			}
			else {
				twitchGet(reqAPI.endpoint || '', reqAPI.d || {}, reqAPI.data || {}, reqAPI.cb || function(customData) { sendResponse(customData) }, reqAPI.authToken || false, true);
			}
			return true;
		}
		return false;
	});

function checkLive(chan) {
	if(streamChannel.indexOf(chan) > -1) {
		getStream(chan, function(data) {
				var timeoutDelay = 1000*60*1,
					stream = data.stream;
				if(_.isNull(stream)) {
					lastCheckedWas[chan] = false;
				}
				else if((_.has(lastCheckedWas, chan) && lastCheckedWas[chan] === false) || !_.has(lastCheckedWas, chan)) {
					lastCheckedWas[chan] = true;
					temporaryList.push({ chan: chan, stream: stream });
					notify(chan, stream);
					timeoutDelay = 1000*60*10;
				}
				checkTimeout[chan] = setTimeout(checkLive, timeoutDelay, chan);
			});
	}
}

function loadSettings(changes, areaName) {
	function setSettings(cfg, justChanges, callback) {
		if(!_.isUndefined(cfg.playSoundOnNotification)) {
			playSoundOnNotification = justChanges ? cfg.playSoundOnNotification.newValue : cfg.playSoundOnNotification;
		}
		if(!_.isUndefined(cfg.channels)) {
			streamChannel = justChanges ? cfg.channels.newValue : cfg.channels;
		}
		if(!_.isUndefined(cfg.checkInterval)) {
			checkInterval = justChanges ? cfg.checkInterval.newValue : cfg.checkInterval;
		}
		if(checkInterval < 5) checkInterval = 5;
		if(_.isFunction(callback)) {
			callback(cfg);
		}
	}
	var defaultSettings = {
				playSoundOnNotification: false,
				channels: ['brownman'],
				checkInterval: 30
			};
	if(_.isFunction(changes)) {
		var callback = changes;
		chrome.storage.sync.get(defaultSettings, function(items) {
				setSettings(items, null, callback);
			});
	}
	else if(_.isObject(changes)) {
		setSettings(changes, true);
	}
}

$(document).ready(function(e) {
		get('database/twitchapi.json', {}, {}, 'GET', function(data, textStatus, jqXHR) {
				twitchAPIDB = data.items;
				loadSettings(function(items) {
						for(var i in streamChannel) {
							checkLive(streamChannel[i]);
						}
					});
			}, 'json');
		/*get('database/iso-languages.json', {}, {}, 'GET', function(data, textStatus, jqXHR) {
				Languages = data;
			}, 'json');*/
	});

chrome.storage.onChanged.addListener(loadSettings);

function receivedClick(notifID, buttonIndex) {
	var note = _.findWhere(notifs, notifID),
		receivedIndex = !_.isUndefined(buttonIndex),
		foundAction = false;
	if(!_.isUndefined(note)) {
		if(receivedIndex && note.actions[buttonIndex] == 'openOptions') {
			chrome.runtime.openOptionsPage();
		}
		else if(note.type == 'streamNowLive') {
			if(!receivedIndex || note.actions[buttonIndex] == 'watchNow') {
				chrome.tabs.create({
						url: format('http://www.twitch.tv/%chan%', { chan: note.chan })
					});
				foundAction = true;
			}
		}
		else if(note.type == 'multipleLive') {
			if(!receivedIndex || note.actions[buttonIndex] == 'openFollowing') {
				chrome.tabs.create({
						url: 'http://twitch.tv/directory/following/live'
					});
				foundAction = true;
			}
		}
	}
	if(foundAction) {
		chrome.notifications.clear(notifID, function(wasCleared) {});
	}
}

chrome.notifications.onButtonClicked.addListener(receivedClick);
chrome.notifications.onClicked.addListener(receivedClick);

/*chrome.browserAction.onClicked.addListener(function() { chrome.runtime.openOptionsPage() });*/

