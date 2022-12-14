/**
 * You can search the compiled code for the name of 
 * this function to test that it was compiled correctly.
 */
function functionToReplaceText() {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron', 'v8']) {
    replaceText(`${type}-version`, process.versions[type])
  }
  replaceText('preload', '👍')
}

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron', 'v8']) {
    replaceText(`${type}-version`, process.versions[type])
  }
  replaceText('preload', '👍')
})

// Export to keep from being tree-shaken by Webpack
export const SOURCE_TEST =
  '*** If this text appears in your packaged app, it means Bytenode is NOT configured correctly! #SOURCE-TEST ***'