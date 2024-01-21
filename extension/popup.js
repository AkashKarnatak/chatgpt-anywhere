const extension = typeof browser !== 'undefined' ? browser : chrome
const $ = (x) => document.querySelector(x)

async function createGptOptions() {
  const { gptModels } = await extension.storage.local.get(['gptModels'])
  if (!gptModels) return

  gptModels.forEach((x) => {
    const input = document.createElement('input')
    input.type = 'radio'
    input.id = x.name
    input.name = 'chatgpt'
    input.value = x.modelName
    input.addEventListener('change', async (e) => {
      const gptSelected = e.target.id
      console.log(gptSelected)
      await extension.storage.local.set({ gptSelected })
    })
    const label = document.createElement('label')
    label.htmlFor = input.id
    label.innerText = x.name
    const br = document.createElement('br')
    $('#options').appendChild(input)
    $('#options').appendChild(label)
    $('#options').appendChild(br)
  })

  const { gptSelected } = await extension.storage.local.get(['gptSelected'])
  if (!gptSelected) return
  $(`#${CSS.escape(gptSelected)}`).checked = true
}

createGptOptions()
