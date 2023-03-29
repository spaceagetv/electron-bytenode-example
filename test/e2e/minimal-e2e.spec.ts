
import { test, expect, _electron as electron, ElectronApplication } from '@playwright/test'
import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers'

export class AppMgr {
  _app: ElectronApplication
  get app() {
    return this._app
  }
  set app(app: ElectronApplication) {
    this._app = app
  }
}

export const appMgr = new AppMgr()

test.beforeAll(async () => {
  const latestBuild = findLatestBuild()
  const appInfo = parseElectronApp(latestBuild)
  const electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable,
  })
  appMgr.app = electronApp
})

test('app should launch and main window should open', async () => {
  const page = await appMgr.app.firstWindow()
  await page.waitForSelector('h1')
  await page.waitForSelector('text=Hello World!')
  // span#preload containing "👍"
  await page.waitForFunction(() => document.querySelector('span#preload')?.textContent === '👍')
  // span#renderer containing "👍"
  await page.waitForFunction(() => document.querySelector('span#renderer')?.textContent === '👍')
  // span#node-renderer containing "👍"
  await page.waitForFunction(() => document.querySelector('span#node-renderer')?.textContent === '👍')
  // span#css-yes has ::after content "👍"
  await page.waitForFunction(() => {
    const span = document.querySelector('span#css-yes') as HTMLSpanElement
    const after = window.getComputedStyle(span, '::after')
    return after.content === '"👍"'
  })
})

