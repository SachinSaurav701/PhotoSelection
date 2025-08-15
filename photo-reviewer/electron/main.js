import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import url, { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { generateReviewPackage, generateReviewPackageFromFiles } from './review.js'
import { applySelectionFile } from './selection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !!process.env.VITE_DEV_SERVER_URL

let mainWindow = null

function getPreloadPath() {
	return path.join(__dirname, 'preload.js')
}

async function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: getPreloadPath(),
			contextIsolation: true,
			nodeIntegration: false
		}
	})

	if (isDev) {
		await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
	} else {
		const basePath = app.isPackaged ? app.getAppPath() : process.cwd()
		const indexHtml = url.pathToFileURL(path.join(basePath, 'dist', 'index.html')).toString()
		await mainWindow.loadURL(indexHtml)
	}

	if (isDev) mainWindow.webContents.openDevTools()
}

app.whenReady().then(async () => {
	await createWindow()
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow()
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('dialog:selectFolder', async () => {
	const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
	if (result.canceled || result.filePaths.length === 0) return null
	return result.filePaths[0]
})

ipcMain.handle('dialog:selectFile', async (_event, filters) => {
	const result = await dialog.showOpenDialog({ properties: ['openFile'], filters })
	if (result.canceled || result.filePaths.length === 0) return null
	return result.filePaths[0]
})

ipcMain.handle('dialog:selectFiles', async (_event, filters) => {
	const result = await dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'], filters })
	if (result.canceled || result.filePaths.length === 0) return []
	return result.filePaths
})

ipcMain.handle('generate:reviewPackage', async (_event, payload) => {
	const { sourceDir, outputDir, options, files } = payload
	if (files && files.length) {
		return generateReviewPackageFromFiles({ files, outputDir, options })
	}
	return generateReviewPackage({ sourceDir, outputDir, options })
})

ipcMain.handle('apply:selection', async (_event, payload) => {
	const { selectionFile, originalsDir, outputDir } = payload
	return applySelectionFile({ selectionFile, originalsDir, outputDir })
})

ipcMain.handle('path:open', async (_event, absPath) => {
	if (!absPath) return false
	await shell.openPath(absPath)
	return true
})