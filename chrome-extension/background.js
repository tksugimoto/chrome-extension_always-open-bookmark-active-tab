'use strict';

let activeOpen = localStorage['activeOpen'] === 'true';
function setActiveTab(bool){
	activeOpen = bool;
	localStorage['activeOpen'] = bool;
}

function refreshBadge(){
	chrome.browserAction.setTitle({
		title: '新しいタブを開いたらアクティブにする : ' + (activeOpen ? 'ON' : 'OFF\nお気に入りから開いた場合は常にアクティブ'),
	});
	// バッジテキスト（メールの未読数とか右下に情報を表示）
	chrome.browserAction.setBadgeText({
		text: activeOpen ? 'on' : '',
	});
}

refreshBadge();

chrome.browserAction.onClicked.addListener(() => {
	setActiveTab(!activeOpen);
	refreshBadge();
});


let last_url = 'dummy';
let last_timestamp = 0;
// タブが開いた時
chrome.tabs.onCreated.addListener(tab => {
	const tabId = tab.id;

	// たまに同じタブが2重3重に開く時があるので、その時に閉じる
	if (/^(?:http|file)/.test(last_url) && last_url === tab.url && (Date.now() - last_timestamp) < 1000) {
		chrome.tabs.remove(tabId);
		last_timestamp = Date.now();
		return;
	}
	last_url = tab.url;
	last_timestamp = Date.now();
	// 2重3重対策ここまで

	if (activeOpen) {
		show(tabId);
		return;
	}
	if (typeof tab.openerTabId === 'undefined') {
		// tabs権限
		if (tab.url === '') {
			// javascriptとか
			show(tabId);
		} else {
			searchBookmark(tab.url, isBookmark => {
				if (isBookmark) show(tabId);
			});
		}
	}
});


function show(tabId){
	chrome.tabs.update(tabId, {
		selected : true,
	});
}

function searchBookmark(url, callback){
	chrome.bookmarks.search({
		url,
	}, results => {
		callback(results.length > 0);
	});
}
