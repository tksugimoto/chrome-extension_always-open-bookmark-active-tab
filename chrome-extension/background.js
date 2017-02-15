"use strict";

let activeOpen = localStorage["activeOpen"] === "true";
function setActiveTab(bool){
	activeOpen = bool;
	localStorage["activeOpen"] = bool;
}

function refreshBadge(){
	chrome.browserAction.setTitle({
		title: "新しいタブを開いたらアクティブにする : " + (activeOpen ? "ON" : "OFF") + "\nお気に入りから開いた場合は常にアクティブ"
	});
	// バッジテキスト（メールの未読数とか右下に情報を表示）
	chrome.browserAction.setBadgeText({
		text: activeOpen ? "on" : ""
	});
}

refreshBadge();

chrome.browserAction.onClicked.addListener(() => {
	setActiveTab(!activeOpen);
	refreshBadge();
});


let last_url = "dummy";
let last_timestamp = 0;
// タブが開いた時
chrome.tabs.onCreated.addListener(info => {
	const tabId = info.id;
	
	// たまに同じタブが2重3重に開く時があるので、その時に閉じる
	if (/^(?:http|file|$)/.test(last_url) && last_url === info.url && (Date.now() - last_timestamp) < 1000) {
		chrome.tabs.remove(tabId);
		last_timestamp = Date.now();
		return;
	}
	last_url = info.url;
	last_timestamp = Date.now();
	// 2重3重対策ここまで
	
	if (activeOpen) {
		show(tabId);
		return
	}
	if (typeof info.openerTabId === "undefined") {
		// tabs権限
		if (info.url === "") {
			// javascriptとか
			show(tabId);
		} else {
			searchBookmark(info.url, isBookmark => {
				if (isBookmark) show(tabId);
			});
		}
	}
});


function show(tabId){
	chrome.tabs.update(tabId, {
		selected : true
	});
}

function searchBookmark(url, callback){
	chrome.bookmarks.search({
		url: url
	}, results => {
		callback(results.length > 0);
	});
}
