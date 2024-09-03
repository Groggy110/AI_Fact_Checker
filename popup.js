console.log('Popup script loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded');
  const messageDiv = document.getElementById('message');
  const resultDiv = document.getElementById('result');
  const analyzeButton = document.getElementById('analyzeButton');

  console.log('Elements found:', {
    messageDiv: !!messageDiv,
    resultDiv: !!resultDiv,
    analyzeButton: !!analyzeButton
  });

  analyzeButton.addEventListener('click', () => {
    console.log('Find Resources button clicked');
    messageDiv.textContent = "Finding resources...";
    resultDiv.innerHTML = "";

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      console.log('Active tab found:', tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, {action: "getSelectedText"}, (response) => {
        console.log('Got response from content script:', response);
        if (response && response.text) {
          chrome.runtime.sendMessage({
            action: "getFactCheckResources", 
            text: response.text
          }, (result) => {
            console.log('Got result from background script:', result);
            if (result.success) {
              resultDiv.innerHTML = sanitizeAndEnsureRootDomains(result.data);
              addLinkEventListeners();
              messageDiv.textContent = "Fact-checking resources:";
            } else {
              resultDiv.textContent = "Error: " + result.error;
              messageDiv.textContent = "An error occurred.";
            }
          });
        } else {
          messageDiv.textContent = "No text selected. Please highlight some text on the page and try again.";
        }
      });
    });
  });
});

function sanitizeAndEnsureRootDomains(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a');
  links.forEach(link => {
    let href = link.getAttribute('href');
    if (href) {
      href = href.startsWith('@') ? href.substring(1) : href;
      try {
        const url = new URL(href);
        link.setAttribute('href', url.origin);
      } catch (e) {
        console.error('Invalid URL:', href);
        link.replaceWith(link.textContent);
      }
    }
    // Wrap the link and its description in a div
    const wrapper = document.createElement('div');
    wrapper.className = 'resource-item';
    link.parentNode.insertBefore(wrapper, link);
    wrapper.appendChild(link);
    if (link.nextSibling && link.nextSibling.nodeType === Node.TEXT_NODE) {
      const description = document.createElement('div');
      description.className = 'resource-description';
      description.textContent = link.nextSibling.textContent.trim();
      wrapper.appendChild(description);
      link.nextSibling.remove();
    }
  });
  return doc.body.innerHTML;
}

function addLinkEventListeners() {
  const links = document.querySelectorAll('#result a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: e.target.href });
    });
  });
}
