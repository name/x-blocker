chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "blockUser") {
        if (request.username && request.username !== 'home') {
            chrome.tabs.create({
                url: `https://x.com/${request.username}?block=true`,
                active: false
            }, (tab) => {
                setTimeout(() => {
                    chrome.tabs.remove(tab.id);
                    sendResponse({success: true});
                    chrome.runtime.sendMessage({
                        action: "removeBlockedUser",
                        username: request.username
                    });
                }, 5000);
            });
        } else {
            console.error('Invalid username received:', request.username);
            sendResponse({success: false, error: 'Invalid username'});
        }
        return true;
    }
});
