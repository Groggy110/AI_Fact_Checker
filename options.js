document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(['apiKey'], (result) => {
      document.getElementById('apiKey').value = result.apiKey || '';
    });
  
    document.getElementById('save').addEventListener('click', () => {
      const apiKey = document.getElementById('apiKey').value;
      chrome.storage.sync.set({apiKey: apiKey}, () => {
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(() => {
          status.textContent = '';
        }, 750);
      });
    });
  });
