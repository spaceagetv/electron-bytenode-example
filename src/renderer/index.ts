// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

import './index.css'

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  replaceText('renderer', '👍')

  if (__filename) {
    replaceText('node-renderer', '👍')
  }
})

// Export to keep from being tree-shaken by Webpack
export const SOURCE_TEST =
  '*** If this text appears in your packaged app, it means Bytenode is NOT configured correctly! #SOURCE-TEST ***'