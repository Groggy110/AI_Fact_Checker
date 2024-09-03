chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFactCheckResources") {
    chrome.storage.sync.get(['apiKey'], (result) => {
      if (!result.apiKey) {
        sendResponse({ success: false, error: "API key not set. Please set your API key in the extension options." });
      } else {
        getFactCheckResources(request.text, result.apiKey)
          .then(data => {
            sendResponse({ success: true, data: data });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }
});

async function getFactCheckResources(text, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {role: "system", content: "You are a helpful assistant that provides links to relevant, reputable websites for fact-checking and research. Analyze the given text and suggest only main homepages of websites that would be helpful for verifying the information. Provide a brief description of why each website might be helpful. Do not create specific article links or modify URLs. Always provide the root domain of the website."},
          {role: "user", content: `Analyze the following text and provide links to 3-5 relevant, reputable websites that would be helpful for fact-checking or researching this information. Use proper HTML formatting for links, providing only the main homepage of each website. For example: <a href="https://www.nasa.gov">NASA</a>. Always use the root domain (like www.example.com) without any path or subdirectories. Include a brief description (1-2 sentences) of why each website might be helpful for fact-checking the given information. The text to analyze is: "${text}"`}
        ],
        max_tokens: 500,
        n: 1,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error fetching fact-check resources:', error);
    throw error;
  }
}
