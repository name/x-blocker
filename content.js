let blockQueue = [];
let isProcessing = false;
let detectedFollowers = new Set();

function addToBlockQueue(users) {
    const validUsers = users.filter(user => user && user !== 'home').map(user => user.replace('@', ''));
    blockQueue = [...blockQueue, ...validUsers];
    if (!isProcessing) {
        processBlockQueue();
    }
}

function processBlockQueue() {
    if (blockQueue.length === 0) {
        isProcessing = false;
        return;
    }

    isProcessing = true;
    const username = blockQueue.shift();
    
    if (username && username !== 'home') {
        chrome.runtime.sendMessage({
            action: "blockUser",
            username: username
        }, (response) => {
            if (response && response.success) {
                console.log(`Blocked ${username}`);
            } else {
                console.error(`Failed to block ${username}`);
            }
            setTimeout(() => {
                processBlockQueue();
            }, 5000);
        });
    } else {
        console.error('Invalid username:', username);
        processBlockQueue();
    }
}

function getNewFollowers() {
    const followersElement = document.querySelector('div[aria-label="Timeline: Followers"]');
    if (!followersElement) {
        return [];
    }

    const followerElements = followersElement.querySelectorAll('a[role="link"]');
    if (!followerElements) {
        return [];
    }

    const newFollowers = Array.from(followerElements)
        .map(followerElement => {
            const spanElement = followerElement.querySelector('span.css-1jxf684');
            if (!spanElement) return null;
            const username = spanElement.textContent.trim();
            if (username.startsWith('@') && isBotUsername(username.substring(1))) {
                return username.substring(1);
            }
            return null;
        })
        .filter(Boolean)
        .filter(username => !detectedFollowers.has(username));

    // Add new followers to the set
    newFollowers.forEach(username => detectedFollowers.add(username));

    return newFollowers;
}

function isBotUsername(username) {
    const botPatterns = [
        /^[A-Z][0-9]{2}[a-zA-Z]{2}\d{2}[A-Z]{2}\d{2}[a-zA-Z]{2}$/, // specific pattern like H00ju22QJR8WdW
        /^@?[a-zA-Z]+\d{5,}$/ // letters followed by 5+ digits
    ];
    
    return botPatterns.some(pattern => pattern.test(username));
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.action === "getFollowers") {
            sendResponse({followers: Array.from(detectedFollowers)});
        } else if (request.action === "blockFollowers") {
            addToBlockQueue(Array.from(detectedFollowers));
            sendResponse({message: "Started blocking process"});
        }
        if (request.action === "removeBlockedUser") {
            detectedFollowers.delete(request.username);
        }
    }
);

setInterval(() => {
    const newFollowers = getNewFollowers();
    if (newFollowers.length > 0) {
        chrome.runtime.sendMessage({
            action: "addNewFollowers",
            followers: newFollowers
        });
    }
}, 250);
