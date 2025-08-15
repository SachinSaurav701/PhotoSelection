import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
	selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
	selectFile: (filters) => ipcRenderer.invoke('dialog:selectFile', filters),
	selectFiles: (filters) => ipcRenderer.invoke('dialog:selectFiles', filters),
	generateReviewPackage: (payload) => ipcRenderer.invoke('generate:reviewPackage', payload),
	applySelection: (payload) => ipcRenderer.invoke('apply:selection', payload),
	openPath: (absPath) => ipcRenderer.invoke('path:open', absPath)
})