const { fetchEventSource } = require('@microsoft/fetch-event-source')

let accessToken

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function getAccessToken() {
  try {
    const res = await fetch('https://chat.openai.com/api/auth/session')
    if (!res.ok) {
      throw new Error('Response status:' + res.status)
    }
    const data = await res.json()
    if (!data.accessToken) {
      throw new Error('No accses token returned')
    }
    accessToken = data.accessToken
    return data.accessToken
  } catch (e) {
    return e
  }
}

const askGPT = ({
  message,
  onMessage,
  conversationId,
  lastParentMessageId,
}) => {
  const conversationIdObj = conversationId
    ? {
        conversation_id: conversationId,
      }
    : {}
  fetchEventSource('https://chat.openai.com/backend-api/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      action: 'next',
      arkose_token: null,
      ...conversationIdObj,
      conversation_mode: { kind: 'primary_assistant' },
      force_paragen: false,
      force_rate_limit: false,
      history_and_training_disabled: true,
      messages: [
        {
          author: { role: 'user' },
          content: {
            content_type: 'text',
            parts: [message],
          },
          id: uuidv4(),
          metadata: {},
        },
      ],
      model: 'text-davinci-002-render-sha',
      parent_message_id: lastParentMessageId,
      suggestions: [],
      timezone_offset_min: -330,
    }),
    openWhenHidden: true,
    onopen: (response) => {
      if (response.ok) {
        return console.log('SSE connection opened')
      }
      console.log('response not 200', response.status)
    },
    onmessage: (msg) => {
      if (msg.event === 'FatalError') {
        console.error('msg event is error', msg.data)
        return
      }
      if (msg.data.includes('[DONE]')) {
        return console.log('done')
      }
      try {
        const parsedData = JSON.parse(msg.data)
        if (!parsedData?.message?.content?.parts?.at(0)) return
        const content = parsedData.message.content.parts[0]
        onMessage({
          content,
          conversationId: parsedData.conversation_id,
          lastParentMessageId: parsedData.message.id,
        })
      } catch (e) {
        if (e.message.includes('JSON')) return
        console.error(e)
      }
    },
    onclose: () => {
      console.log('server closed connection')
    },
    onerror: (err) => {
      if (err instanceof Error) {
        console.error('unexpected error', err)
      } else {
        console.log('retrying', err)
      }
    },
  })
}

chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === 'openai')
  port.onMessage.addListener(
    ({ message, conversationId, lastParentMessageId }) => {
      askGPT({
        message: message,
        onMessage: ({ content, conversationId, lastParentMessageId }) => {
          port.postMessage({ content, conversationId, lastParentMessageId })
        },
        conversationId: conversationId,
        lastParentMessageId: lastParentMessageId,
      })
    },
  )
})

if (!accessToken) {
  getAccessToken()
    .then(() => {
      console.log(accessToken)
    })
    .catch((e) => {
      console.error(e)
    })
}

self.extra = {
  fetchEventSource,
}
