// content.js - Silent Watcher
/**let currentTrack = null;

const observer = new MutationObserver(() => {
  const metadata = navigator.mediaSession?.metadata;
  if (!metadata) return;

  const song = metadata.title;
  const artist = metadata.artist;
  const platform = window.location.hostname.includes('spotify') ? 'spotify' : 
                   window.location.hostname.includes('youtube') ? 'youtube' : 'jiosaavn';

  if (currentTrack?.song !== song) {
    currentTrack = { song, artist, platform, timestamp: Date.now() };
    chrome.storage.local.set({ currentTrack }, () => {
      console.log('Track detected:', currentTrack);
    });
  }
});

observer.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });
// public/content.js - Silent Watcher
let currentTrack = null;

const observer = new MutationObserver(() => {
  const metadata = navigator.mediaSession?.metadata;
  if (!metadata) return;
  const song = metadata.title;
  const artist = metadata.artist;
  const platform = window.location.hostname.includes('spotify') ? 'spotify' :
                    window.location.hostname.includes('youtube') ? 'youtube' : 'jiosaavn';

  if (currentTrack?.song !== song) {
    currentTrack = { song, artist, platform, timestamp: Date.now() };
    chrome.storage.local.set({ currentTrack }, () => {
      console.log('Track detected:', currentTrack);
    });
  }
});

observer.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });

// NEW: Live Time Tracker (Checks playback time every 500ms)
setInterval(() => {
  const mediaElement = document.querySelector('video, audio');
  if (mediaElement && !mediaElement.paused) {
    chrome.storage.local.set({ currentPlaybackTime: mediaElement.currentTime });
  }
}, 500);**/

//------------------------------------------------------------------------------------------------------------------
// public/content.js - Smart Watcher & Time Tracker
/**let currentTrack = null;

// Har 500ms mein gaane ka naam aur time dono ek sath check karega
setInterval(() => {
  // 1. Check Track Info
  const metadata = navigator.mediaSession?.metadata;
  if (metadata) {
    const song = metadata.title;
    const artist = metadata.artist;
    const platform = window.location.hostname.includes('spotify') ? 'spotify' :
                     window.location.hostname.includes('youtube') ? 'youtube' : 'jiosaavn';

    // Agar gaana change hua hai, toh update karo
    if (!currentTrack || currentTrack.song !== song) {
      currentTrack = { song, artist, platform, timestamp: Date.now() };
      chrome.storage.local.set({ currentTrack }, () => {
        console.log('New Track Detected:', currentTrack);
      });
    }
  }

  // 2. Check Live Playback Time (For Syncing Lyrics)
  const mediaElement = document.querySelector('video, audio');
  if (mediaElement && !mediaElement.paused) {
    chrome.storage.local.set({ currentPlaybackTime: mediaElement.currentTime });
  }
}, 500);**/

//------------------------------------------------------------------------------------------------------------------

// public/content.js - Smart Watcher & Time Tracker
/**let currentTrack = null;

setInterval(() => {
  // 1. Check Track Info
  const metadata = navigator.mediaSession?.metadata;
  if (metadata) {
    const song = metadata.title;
    const artist = metadata.artist;
    const platform = window.location.hostname.includes('spotify') ? 'spotify' :
                     window.location.hostname.includes('youtube') ? 'youtube' : 'jiosaavn';

    if (!currentTrack || currentTrack.song !== song) {
      currentTrack = { song, artist, platform, timestamp: Date.now() };
      chrome.storage.local.set({ currentTrack }, () => {
        console.log('New Track Detected:', currentTrack);
      });
    }
  }

  // 2. SMART Live Playback Time (Ignores Spotify Canvas Videos)
  const mediaElements = document.querySelectorAll('video, audio');
  let mainAudio = null;
  
  mediaElements.forEach((el) => {
    // Asli gaane ki duration badi hoti hai (> 30 sec) aur wo play ho raha hona chahiye
    if (!el.paused && el.duration > 30) {
      mainAudio = el;
    }
  });

  if (mainAudio) {
    chrome.storage.local.set({ currentPlaybackTime: mainAudio.currentTime });
  }
}, 500);**/

//------------------------------------------------------------------------------------------------------------------

// public/content.js - Ultimate Time Tracker
/**let currentTrack = null;

setInterval(() => {
  // 1. Check Track Info
  const metadata = navigator.mediaSession?.metadata;
  if (metadata) {
    const song = metadata.title;
    const artist = metadata.artist;
    const platform = window.location.hostname.includes('spotify') ? 'spotify' :
                     window.location.hostname.includes('youtube') ? 'youtube' : 'jiosaavn';

    if (!currentTrack || currentTrack.song !== song) {
      currentTrack = { song, artist, platform, timestamp: Date.now() };
      chrome.storage.local.set({ currentTrack });
    }
  }

  // 2. THE FIX: Find the actual song (Ignores 8-second Canvas videos)
  let mainMedia = null;
  let maxDuration = -1;

  document.querySelectorAll('video, audio').forEach((el) => {
    if (!el.paused) {
      let d = el.duration;
      // Agar streaming ki wajah se duration NaN ya Infinity hai, toh usey sabse bada maan lo
      if (!d || isNaN(d) || d === Infinity) {
        d = 999999; 
      }
      
      // Sabse badi duration wali chiz hi asli gaana hoti hai
      if (d > maxDuration) {
        maxDuration = d;
        mainMedia = el;
      }
    }
  });

  // Time update karo
  if (mainMedia) {
    chrome.storage.local.set({ currentPlaybackTime: mainMedia.currentTime });
  }
}, 500);**/

//------------------------------------------------------------------------------------------------------------------

// public/content.js - Ultimate Time Tracker (Zombie Proof)
/**let currentTrack = null;

const intervalId = setInterval(() => {
  // ZOMBIE KILLER: Agar extension reload hua hai, toh is purane script ko chup-chaap band kar do
  if (!chrome.runtime?.id) {
    clearInterval(intervalId);
    return;
  }

  // 1. Check Track Info
  const metadata = navigator.mediaSession?.metadata;
  if (metadata) {
    const song = metadata.title;
    const artist = metadata.artist;
    const platform = window.location.hostname.includes('spotify') ? 'spotify' :
                     window.location.hostname.includes('youtube') ? 'youtube' : 'jiosaavn';

    if (!currentTrack || currentTrack.song !== song) {
      currentTrack = { song, artist, platform, timestamp: Date.now() };
      chrome.storage.local.set({ currentTrack });
    }
  }

  // 2. THE FIX: Find the actual song (Ignores 8-second Canvas videos)
  let mainMedia = null;
  let maxDuration = -1;

  document.querySelectorAll('video, audio').forEach((el) => {
    if (!el.paused) {
      let d = el.duration;
      // Agar streaming ki wajah se duration NaN ya Infinity hai, toh usey sabse bada maan lo
      if (!d || isNaN(d) || d === Infinity) {
        d = 999999; 
      }
      
      // Sabse badi duration wali chiz hi asli gaana hoti hai
      if (d > maxDuration) {
        maxDuration = d;
        mainMedia = el;
      }
    }
  });

  // Time update karo
  if (mainMedia) {
    chrome.storage.local.set({ currentPlaybackTime: mainMedia.currentTime });
  }
}, 500);**/

//------------------------------------------------------------------------------------------------------------------

// public/content.js - Ultimate UI Time Scraper
let currentTrack = null;

const intervalId = setInterval(() => {
  // Zombie killer logic
  if (!chrome.runtime?.id) {
    clearInterval(intervalId);
    return;
  }

  const metadata = navigator.mediaSession?.metadata;
  let platform = 'spotify';
  if (window.location.hostname.includes('youtube')) platform = 'youtube';
  if (window.location.hostname.includes('jiosaavn')) platform = 'jiosaavn';

  // 1. Check Track Info
  if (metadata) {
    const song = metadata.title;
    const artist = metadata.artist;

    if (!currentTrack || currentTrack.song !== song) {
      currentTrack = { song, artist, platform, timestamp: Date.now() };
      chrome.storage.local.set({ currentTrack });
    }
  }

  // 2. THE ULTIMATE FIX: Read the exact time directly from the Spotify screen!
  let currentTime = 0;

  if (platform === 'spotify') {
    // Spotify screen par jahan "0:32" likha hota hai, uska element dhundo
    const timeEl = document.querySelector('[data-testid="playback-position"]');
    if (timeEl && timeEl.textContent) {
      const parts = timeEl.textContent.trim().split(':');
      if (parts.length === 2) {
         // Example: "0:32" -> 0 * 60 + 32 = 32 seconds
         currentTime = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      } else if (parts.length === 3) {
         // Example: "1:02:30"
         currentTime = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
      }
    }
  }

  // Fallback for YouTube / JioSaavn
  if (currentTime === 0 && platform !== 'spotify') {
    document.querySelectorAll('video, audio').forEach((el) => {
      if (el.currentTime > 0 && !el.paused) {
        currentTime = el.currentTime;
      }
    });
  }

  // 3. Send the exact time to your App.tsx
  if (currentTime > 0) {
    chrome.storage.local.set({ currentPlaybackTime: currentTime });
  }
}, 500);