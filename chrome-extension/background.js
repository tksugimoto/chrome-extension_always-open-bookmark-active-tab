'use strict';

function getActiveOpen(callback) {
	chrome.storage.local.get({
		activeOpen: false /* default value */,
	}, ({activeOpen}) => {
		callback(activeOpen);
	});
}

function setActiveOpen(bool){
	chrome.storage.local.set({
		activeOpen: bool,
	});
}

function refreshBadge(activeOpen){
	chrome.browserAction.setTitle({
		title: '新しいタブを開いたらアクティブにする : ' + (activeOpen ? 'ON' : 'OFF\nお気に入りから開いた場合は常にアクティブ'),
	});
	// バッジテキスト（メールの未読数とか右下に情報を表示）
	chrome.browserAction.setBadgeText({
		text: activeOpen ? 'on' : '',
	});
}

getActiveOpen(refreshBadge);

chrome.browserAction.onClicked.addListener(() => {
	getActiveOpen(activeOpen => {
		setActiveOpen(!activeOpen);
		refreshBadge(!activeOpen);
	});
});


let last_url = 'dummy';
let last_timestamp = 0;
// タブが開いた時
chrome.tabs.onCreated.addListener(tab => {
	const tabId = tab.id;
	const url = tab.pendingUrl || tab.url;

	// たまに同じタブが2重3重に開く時があるので、その時に閉じる
	if (/^(?:http|file)/.test(last_url) && last_url === url && (Date.now() - last_timestamp) < 1000) {
		chrome.tabs.remove(tabId);
		last_timestamp = Date.now();
		return;
	}
	last_url = url;
	last_timestamp = Date.now();
	// 2重3重対策ここまで

	getActiveOpen(activeOpen => {
		if (activeOpen) {
			show(tabId);
			return;
		}
		if (typeof tab.openerTabId === 'undefined') {
			// tabs権限
			if (url === '') {
				// javascriptとか
				show(tabId);
			} else {
				searchBookmark(url, isBookmark => {
					if (isBookmark) show(tabId);
				});
			}
		}
	});
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
