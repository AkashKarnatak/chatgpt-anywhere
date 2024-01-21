const extension = typeof browser !== 'undefined' ? browser : chrome
const { fetchEventSource } = require('@microsoft/fetch-event-source')
const { getToken } = require('chatgpt-arkose-token-generator')

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

async function getGPTModels() {
  try {
    const res = await fetch(
      'https://chat.openai.com/backend-api/models?history_and_training_disabled=true',
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      },
    )
    if (!res.ok) {
      throw new Error('Response status:' + res.status)
    }
    const data = await res.json()
    const gptModels = data?.categories?.map((x) => {
      return {
        name: x.human_category_name,
        modelName: x.default_model,
      }
    })
    if (!gptModels) {
      throw new Error('No models found')
    }
    await extension.storage.local.set({ gptModels })
    // right now openai returns their model in ascending
    // order (worst to best). This should select the best
    // model
    await extension.storage.local.set({ gptSelected: gptModels.at(-1).name })
  } catch (e) {
    return e
  }
}

const askGPT = async ({
  message,
  onMessage,
  conversationId,
  lastParentMessageId,
}) => {
  const opts = {
    arkose_token: null,
  }
  if (conversationId) {
    opts.conversation_id = conversationId
  }
  const { gptSelected, gptModels } = await extension.storage.local.get([
    'gptSelected',
    'gptModels',
  ])
  const model =
    gptModels.find((x) => x.name === gptSelected)?.modelName ||
    'text-davinci-002-render-sha'
  if (model !== 'text-davinci-002-render-sha') {
    // NOTE: there's something magical about this public key
    // as it does not require sending of additional data
    // string for generating arkose token.
    // TODO: Figure out what's up
    const { token } = await getToken({
      pkey: '3D86FBBA-9D22-402A-B512-3420086BA6CC',
      surl: 'https://tcr9i.chat.openai.com',
      site: 'https://chat.openai.com',
    })
    opts.arkose_token = token || null
  }
  fetchEventSource('https://chat.openai.com/backend-api/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({
      action: 'next',
      ...opts,
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
      model,
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

extension.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === 'openai')
  port.onMessage.addListener(
    async ({ message, conversationId, lastParentMessageId }) => {
      await askGPT({
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
;(async () => {
  if (accessToken) return
  const err = await getAccessToken()
  console.log(accessToken)
  if (err instanceof Error) {
    console.error(err)
  }
  const err2 = await getGPTModels()
  if (err2 instanceof Error) {
    console.error(err2)
  }
})()

self.extra = {
  fetchEventSource,
}
