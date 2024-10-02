let detectedUsers = [];

document.getElementById('refreshButton').addEventListener('click', refreshFollowers);
document.getElementById('blockButton').addEventListener('click', blockFollowers);

function refreshFollowers() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "getFollowers"}, function(response) {
            if (response && response.followers) {
                detectedUsers = response.followers;
                updateUserList();
            }
        });
    });
}

function blockFollowers() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "blockFollowers"}, function(response) {
            if (response && response.message) {
                document.getElementById('status').textContent = response.message;
            }
        });
    });
}

function updateUserList() {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '';
    document.getElementById('blockedCount').textContent = detectedUsers.length;
    detectedUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.textContent = user;
        userListElement.appendChild(userItem);
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "addNewFollowers") {
        request.followers.forEach(follower => {
            if (!detectedUsers.includes(follower)) {
                detectedUsers.push(follower);
            }
        });
        updateUserList();
    } else if (request.action === "removeBlockedUser") {
        detectedUsers = detectedUsers.filter(user => user !== request.username);
        updateUserList();
    }
});


refreshFollowers();

setInterval(refreshFollowers, 250);
