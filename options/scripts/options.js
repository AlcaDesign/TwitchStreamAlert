var background = chrome.extension.getBackgroundPage(),
	Languages = {},
	
	currentSearching = false;

function numberFormat(number, dec, dsep, tsep) { // https://github.com/epeli/underscore.string/blob/master/numberFormat.js
  if (isNaN(number) || number == null) return '';

  number = number.toFixed(~~dec);
  tsep = typeof tsep == 'string' ? tsep : ',';

  var parts = number.split('.'),
    fnums = parts[0],
    decimals = parts[1] ? (dsep || '.') + parts[1] : '';

  return fnums.replace(/(\d)(?=(?:\d{3})+$)/g, '$1' + tsep) + decimals;
}

function save() {
	if(chrome.storage) {
		var checkInterval = $('#checkInterval').val();
		chrome.storage.sync.set({
				playSoundOnNotification: $('#playSoundOnNotification').prop('checked'),
				checkInterval: checkInterval < 5 ? 5 : checkInterval
			}, function() {
					setTimeout(function() {
							$('#hidden .loader').removeClass('show');
						}, 1250);
				});
		return true;
	}
	return false;
}

function restore() {
	if(chrome.storage) {
		chrome.storage.sync.get({
				playSoundOnNotification: false,
				channels: ['brownman'],
				checkInterval: 30
			}, function(items) {
					$('#playSoundOnNotification').prop('checked', items.playSoundOnNotification);
					$('#checkInterval').val(items.checkInterval < 5 ? 5 : items.checkInterval);
					console.log(items);
				});
	}
}
/*document.addEventListener('DOMContentLoaded', restore);*/

function addChannel(open, options) {
	if(open === true) {
		var loader = $('.loader').clone();
		loader.find('svg').remove();
		loader.appendTo('#channellist');
		setTimeout(function() {
				loader.addClass('show');
				$('#addchannel-dialogue').addClass('show');
				$('#addchannel-dialogue-name').focus();
			}, 20);
	}
	else if(open === false) {
		var loader = $('#channellist .loader');
		loader.removeClass('show');
		$('#addchannel-dialogue').removeClass('show');
		setTimeout(function() {
				loader.remove();
			}, 500);
	}
	else if(open === null) {
		console.log('Will add', options);
	}
}

function searchForChannel() {
	function showSearchedChannel(data) {
		var sr = $('#addchannel-dialogue-searchresults .scrollable');
		if(!data.hasOwnProperty('channels') || data.channels.length == 0) { // Channel not found
			console.log('Not found');
			sr.empty();
			var c = data.channels[i],
				channel = $('<div/>'),
				channelLogo = $('<div/>'),
				channelAdd = $('<div/>'),
				channelName = $('<div/>');
			channelLogo.addClass('channel-logo').css('background-image', 'url(images/ic_error_outline_black_24px.svg)');
			channelName.addClass('channel-name').css({ lineHeight: '58px', paddingBottom: 0 }).html('Nothing found.');
			channel.addClass('channel').append(channelLogo, channelAdd, channelName);
			sr.append(channel);
		}
		else {
			console.log(arguments);
			sr.empty();
			var chans = data.channels.reduce(function(previousValue, current, i, arr) {
					var key = current.partner ? 0 : 1; // Prioritize partners
					if(key == 0) {
						previousValue[key].push(current);
					}
					else {
						var key2 = +(new Date(current.created_at) > 31); // Prioritize accounts older than a month
						previousValue[key][key2].push(current);
					}
					return previousValue;
				}, [[], [[],[]]]);
			console.log(chans);
			chans = chans[0].concat(chans[1][0].concat(chans[1][1]));
			for(var i in data.channels) {
				var c = chans[i],
					channel = $('<div/>'),
					channelLogo = $('<div/>'),
					channelAdd = $('<div/>'),
					channelName = $('<div/>');
				channelLogo.addClass('channel-logo').css('background-image', 'url(' + (c.logo || 'http://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_150x150.png').replace('300x300.', '50x50.') + ')');
				channelAdd.addClass('channel-add add');
				var channelAttr = [numberFormat(c.followers) + ' followers'],
					language = c.language.split('-')[0].toLowerCase();
				if(c.partner) channelAttr.push('Partnered');
				if(Languages.hasOwnProperty(language)) channelAttr.push(Languages[language].name);
				channelName.addClass('channel-name').data('name', c.name).html((c.partner ? '<span class="verified" title="Partnered"></span>' : '') + c.display_name + '<div class="low-opacity">' + channelAttr.join(' &bull; ') + '</div>');
				channel.addClass('channel').append(channelLogo, channelAdd, channelName);
				sr.append(channel);
			}
			sr.scrollTop(0);
		}
	}
	var chanName = $('#addchannel-dialogue-name').val();
	if(chrome.storage && chanName.length > 0 && !currentSearching) {
		var loader = $('.loader').clone();
		currentSearching = true;
		loader.appendTo('#addchannel-dialogue-searchresults');
		setTimeout(function() {
				loader.addClass('show');
			}, 20);
		chrome.runtime.sendMessage({ type: 'custom', api: 
					{
							endpoint: 'findChannels',
							data: { q: $('#addchannel-dialogue-name').val() }
						}
			}, function(response) {
					currentSearching = false;
					loader.removeClass('show');
					setTimeout(function() {
							loader.remove();
						}, 500);
					showSearchedChannel(response);
				});
	}
}

$(document).ready(function(e) {
		
		restore();
		
		background.get('database/iso-languages.json', {}, {}, 'GET', function(data, textStatus, jqXHR) {
				Languages = data;
			}, 'json');
		
		$(window).load(function(e) {
				//addChannel(true);
			});
		
		$('#save').click(function(e) {
				var canSave = save();
				$('#hidden .loader').addClass('show');
				if(!canSave) {
					setTimeout(function() {
							$('#hidden .loader').removeClass('show');
						}, 750);
				}
			});
		
		$(document).bind('click', '.channel-remove', function(e) {
				var target = $(e.target);
				if(target.hasClass('channel-remove')) {
					target.parent('.channel').remove();
				}
			});
		
		$('.add#addchannel').click(function(e) {
				addChannel(true);
			});
		$('#addchannel-dialogue-header .remove').click(function(e) {
				addChannel(false);
			});
		$('#addchannel-dialogue-dosearch').click(searchForChannel);
		$('#addchannel-dialogue-name').keyup(function(e){
				if(e.keyCode == 13) {
					searchForChannel();
				}
			});
	});



