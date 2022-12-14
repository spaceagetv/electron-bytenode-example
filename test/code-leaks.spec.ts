import { describe } from 'mocha'
import { expect } from 'chai'
import { listPackage, extractFile } from '@electron/asar'
import { parseElectronApp, findLatestBuild } from 'electron-playwright-helpers'
import path from 'path'
import fs from 'fs'

describe('CODE LEAKS', () => {
  it('should not leak source code', () => {
    const latestBuild = findLatestBuild()
    expect(latestBuild, 'Cannot find build in "out" directory').to.exist
    expect(latestBuild).to.be.a('string')
    const appInfo = parseElectronApp(latestBuild)
    expect(appInfo, 'Cannot parse build').to.exist
    expect(appInfo).to.be.an('object')
    if (appInfo.asar) {
      const archive = path.join(appInfo.resourcesDir, 'app.asar')
      const files = listPackage(archive)
      expect(files, 'Cannot list files in asar').to.exist
      expect(files).to.be.an('array')
      expect(files).not.to.be.empty

      const jsFiles = files.filter((file) => file.endsWith('.js'))
      expect(jsFiles, 'No .js files found in asar').to.exist
      expect(jsFiles).to.be.an('array')
      expect(jsFiles, 'No .js files found in asar').not.to.be.empty

      for (const file of jsFiles) {
        // strip the leading "/" from the file name
        const fileContents = extractFile(archive, file.slice(1))
        expect(fileContents, `Cannot read file "${file}"`).to.exist
        expect(fileContents).to.be.instanceOf(Buffer)
        const relativePath = file.replace(archive, '').slice(1)
        expect(fileContents.toString(), `"${relativePath}" CONTAINS SOURCE CODE`).not.to.include('#SOURCE-TEST')
      }
    } else {
      const appDir = path.join(appInfo.resourcesDir, 'app')
      // recursively list all of the files in the resourcesDir
      const files = getAllFiles(appInfo.resourcesDir)
      const jsFiles = files
        .filter((file) => file.endsWith('.js'))

      for (const file of jsFiles) {
        /** uint8Array */
        const fileContents = fs.readFileSync(file)
        expect(fileContents, `Cannot read file "${file}"`).to.exist
        expect(fileContents).to.be.instanceOf(Buffer)
        const relativePath = file.replace(appDir, '').slice(1)
        expect(fileContents.toString(), `"${relativePath}" CONTAINS SOURCE CODE`).not.to.include('#SOURCE-TEST')
      }
    }
  })
})

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true })
  files.forEach((file) => {
    if (file.isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file.name), arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(dirPath, file.name))
    }
  })
  return arrayOfFiles
}

