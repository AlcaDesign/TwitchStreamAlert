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
			}, 20);
	}
	else if(open === false) {
		var loader = $('#channellist .loader');
		loader.removeClass('show');
		$('#addchannel-dialogue').removeClass('show');
		setTimeout(function() {
				loader.remove();
			});
	}
	else if(open === null) {
		console.log('Will add', options);
	}
}

function searchForChannel() {
	function showSearchedChannel(data) {
		if(data.status == 404) {
		}
		else {
			
		}
	}
	if(chrome.storage) {
		chrome.runtime.sendMessage({ type: 'custom', api: [
					{
							endpoint: 'channel',
							d: { channel: $('#addchannel-dialogue-name').val() }
						}
				]
			}, showSearchedChannel);
	}
	else {
		showSearchedChannel(JSON.parse('{"channel":{"mature":true,"status":"Alcabot - Custom Twitch Chat and Statistic Bot","broadcaster_language":"en","display_name":"Alca","game":"Programming","delay":0,"language":"en","_id":7676884,"name":"alca","created_at":"2009-08-10T17:32:19Z","updated_at":"2015-06-30T01:18:12Z","logo":"http://static-cdn.jtvnw.net/jtv_user_pictures/alca-profile_image-9bbabc25f6768970-300x300.png","banner":null,"video_banner":"http://static-cdn.jtvnw.net/jtv_user_pictures/alca-channel_offline_image-266ca5f76d6a51c8-640x360.png","background":null,"profile_banner":"http://static-cdn.jtvnw.net/jtv_user_pictures/alca-profile_banner-402e93e46fa2eae0-480.png","profile_banner_background_color":"#333333","partner":false,"url":"http://www.twitch.tv/alca","views":356,"followers":78,"_links":{"self":"https://api.twitch.tv/kraken/channels/alca","follows":"https://api.twitch.tv/kraken/channels/alca/follows","commercial":"https://api.twitch.tv/kraken/channels/alca/commercial","stream_key":"https://api.twitch.tv/kraken/channels/alca/stream_key","chat":"https://api.twitch.tv/kraken/chat/alca","features":"https://api.twitch.tv/kraken/channels/alca/features","subscriptions":"https://api.twitch.tv/kraken/channels/alca/subscriptions","editors":"https://api.twitch.tv/kraken/channels/alca/editors","teams":"https://api.twitch.tv/kraken/channels/alca/teams","videos":"https://api.twitch.tv/kraken/channels/alca/videos"}}}'));
	}
}

$(document).ready(function(e) {
		
		restore();
		
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



