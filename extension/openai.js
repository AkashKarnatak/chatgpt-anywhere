const extension = typeof browser !== 'undefined' ? browser : chrome

/**
 * Generates a random UUID (Universally Unique Identifier) of version 4 as per RFC 4122.
 * @returns {string} A random version 4 UUID string.
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Represents a conversation with OpenAI.
 * Conversation history is preserved when making multiple ask
 * calls using same object.
 */
class OpenAIConversation {
  /**
   * Creates an instance of OpenAIConversation.
   * @param {(content: string) => void} onMessage - Callback function for handling openai streaming response.
   */
  constructor(onMessage) {
    this.conversationId = undefined
    this.lastParentMessageId = uuidv4()
    this.port = extension.runtime.connect({ name: 'openai' })
    this.port.onMessage.addListener(
      ({ content, conversationId, lastParentMessageId }) => {
        this.conversationId = conversationId
        this.lastParentMessageId = lastParentMessageId
        onMessage(content)
      },
    )
  }

  /**
   * Sends a message to ChatGPT.
   * @param {string} message - The message to send.
   */
  ask(message) {
    this.port.postMessage({
      message,
      conversationId: this.conversationId,
      lastParentMessageId: this.lastParentMessageId,
    })
  }
}
