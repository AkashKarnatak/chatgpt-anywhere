const extension = typeof browser !== 'undefined' ? browser : chrome

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

let something
class OpenAIConversation {
  constructor(onMessage, conversationId) {
    this.conversationId = conversationId
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

  ask(message) {
    this.port.postMessage({
      message,
      conversationId: this.conversationId,
      lastParentMessageId: this.lastParentMessageId,
    })
  }
}
