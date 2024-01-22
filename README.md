# ChatGPT Anywhere

Why pay for ChatGPT's API when it's free in the browser?

ChatGPT Anywhere is a browser extension skeleton for seamless ChatGPT integration, interacting directly with
the ChatGPT browser API and offering developers a cost-efficient solution by eliminating the need for OpenAI's
paid API calls.

## Features
* **Convenient API**: Offers a straightforward and easy-to-use interface for integrating ChatGPT functionalities.
* **Cost-effective**: Reduces costs by eliminating the need for OpenAI's paid API calls, as it interacts directly with the ChatGPT browser API.
* **Flexible**: Designed as a skeleton, it provides a solid starting point for building a wide range of browser extensions utilizing ChatGPT.
* **ChatGPT Plus Compatibility**: Supports users with ChatGPT Plus subscriptions, providing access to the enhanced capabilities of ChatGPT 4 API.
* **Version Selection Menu**: Includes a convenient options menu in the extension popup, allowing users to select between different versions of ChatGPT.

## Setup and Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AkashKarnatak/chatgpt-anywhere.git
   ```

2. Navigate to the project directory:

   ```bash
   cd chatgpt-anywhere
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Build the extension for chrome and firefox:

   ```bash
   npm run build
   ```

5. After building, two folders named `chrome-extension` and `firefox-extension` will
be created. You can now load these extensions into their respective browsers
for testing.

## Usage: Building with OpenAIConversation API
The `OpenAIConversation` class provided in the `extension/openai.js` file allows
developers to easily integrate ChatGPT conversations within their browser
extensions. Each instance of `OpenAIConversation` represents a new conversation
with ChatGPT, and the ask method preserves the conversation history for ongoing
interactions.

To use the API in your extension, follow these steps:

1. Access OpenAIConversation API:
`content-script.js` has access to the `OpenAIConversation` class defined in
`openai.js`.

2. Create a New Conversation Instance:
Create a new instance of `OpenAIConversation`. This instance will handle the
communication with ChatGPT. For example:

```js
const conv = new OpenAIConversation({
  onMessage: (content) => {
    // Handle the response from ChatGPT here.
    // Eg: Changing text content of a div
    console.log(content);
  },
  onError: (error) => {
    // Handle any errors here.
    console.error(error);
  }
});
```

3. Initiate a Conversation:
Use the `ask` method to send a message to ChatGPT and start the conversation.
Subsequent calls to `ask` will continue the conversation with the preserved history.
For example:

```js
conv.ask('Why does the sky appear blue?');
```

4. Handle Responses and Errors:
Implement the `onMessage` and `onError` callbacks to process responses and
handle errors respectively.

5. Integrate into Extension Functionality:
Use the conversation object within your extension's functionality to enable
dynamic interactions with ChatGPT.

## Extensions Built on ChatGPT Anywhere

* [**YTGPT**](https://github.com/akashKarnatak/ytgpt): YTGPT is a Google Chrome extension that utilizes "ChatGPT Anywhere" to provide concise summaries of YouTube videos. It is especially useful for users who want to quickly understand the key points of lengthy videos without spending a lot of time watching them. YTGPT offers an efficient and user-friendly solution for staying informed on various topics covered in YouTube videos.

If you have developed an extension using "ChatGPT Anywhere" and would like to
feature it here, please share details about your project in this [issue](https://github.com/AkashKarnatak/chatgpt-anywhere/issues/1).

## Contributing

Contributions are welcome! If you find a bug, have an idea for an enhancement, or want to contribute in any way, feel free to open an issue or submit a pull request.

## License

This project is licensed under the AGPL3 License. For details, see the [LICENSE](LICENSE) file.
