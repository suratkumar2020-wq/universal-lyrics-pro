// public/background.js
console.log("Universal Lyrics Pro background worker started.");
chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: 'index.html',
    type: 'popup', // Ye isko ek clean floating window banata hai (minimize/maximize/close buttons ke sath)
    width: 380,
    height: 650,
    focused: true
  });
});