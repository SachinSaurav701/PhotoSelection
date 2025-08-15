import React, { useState } from 'react'

function Row({ label, children }) {
	return (
		<div className="row">
			<label>{label}</label>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
				{children}
			</div>
		</div>
	)
}

export default function App() {
	const [imagesSource, setImagesSource] = useState('folder') // 'folder' | 'files'
	const [sourceDir, setSourceDir] = useState('')
	const [selectedFiles, setSelectedFiles] = useState([])
	const [outputDir, setOutputDir] = useState('')
	const [quality, setQuality] = useState(60)
	const [maxSize, setMaxSize] = useState(1600)
	const [log, setLog] = useState('')
	const [busy, setBusy] = useState(false)

	async function pickFolder(setter) {
		const dir = await window.api.selectFolder()
		if (dir) setter(dir)
	}

	async function pickFiles() {
		const file = await window.api.selectFile([{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }])
		// Single-file dialog in this simple bridge; instruct user to use a folder for many files
		if (file) setSelectedFiles([file])
	}

	async function handleGenerateReview() {
		if (!outputDir) return setLog('Choose Output folder')
		if (imagesSource === 'folder' && !sourceDir) return setLog('Choose Source folder')
		if (imagesSource === 'files' && selectedFiles.length === 0) return setLog('Choose at least one image')
		setBusy(true)
		setLog('Generating review package...')
		try {
			const payload = {
				outputDir,
				options: { quality: Number(quality), maxSize: Number(maxSize) }
			}
			if (imagesSource === 'folder') payload.sourceDir = sourceDir
			else payload.files = selectedFiles
			const res = await window.api.generateReviewPackage(payload)
			setLog(`Review ready at: ${res.outputDir}`)
		} catch (e) {
			setLog(`Error: ${e.message || e}`)
		} finally { setBusy(false) }
	}

	async function handleImportSelection() {
		const selectionPath = await window.api.selectFile([{ name: 'Selection Text', extensions: ['txt'] }])
		if (!selectionPath) return
		if (!sourceDir) return setLog('Choose Originals folder (source of full-quality)')
		const copyOut = outputDir || (await window.api.selectFolder())
		if (!copyOut) return
		setBusy(true)
		setLog('Applying selection and copying originals...')
		try {
			const res = await window.api.applySelection({ selectionFile: selectionPath, originalsDir: sourceDir, outputDir: copyOut })
			setLog(`Copied ${res.copied} files to: ${res.outputDir}`)
		} catch (e) {
			setLog(`Error: ${e.message || e}`)
		} finally { setBusy(false) }
	}

	return (
		<div className="container">
			<header>
				<h1>Photo Reviewer</h1>
			</header>

			<Row label="Add images">
				<select value={imagesSource} onChange={e => setImagesSource(e.target.value)}>
					<option value="folder">From folder</option>
					<option value="files">Pick files</option>
				</select>
				{imagesSource === 'folder' ? (
					<>
						<input value={sourceDir} placeholder="Source folder" disabled />
						<button onClick={() => pickFolder(setSourceDir)}>Browse</button>
					</>
				) : (
					<>
						<input value={selectedFiles.join(', ')} placeholder="Selected files" disabled />
						<button onClick={pickFiles}>Pick</button>
					</>
				)}
			</Row>

			<Row label="Output folder">
				<input value={outputDir} placeholder="Output folder" disabled />
				<button onClick={() => pickFolder(setOutputDir)}>Browse</button>
			</Row>

			<Row label="Quality / Size">
				<input type="number" value={quality} onChange={(e) => setQuality(e.target.value)} min={1} max={100} />
				<input type="number" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} min={400} max={8000} />
			</Row>

			<div className="actions">
				<button onClick={handleGenerateReview} disabled={busy}>{busy ? 'Working…' : 'Generate Client Review'}</button>
				<button onClick={handleImportSelection} disabled={busy}>Import Selection (.txt) and Copy Originals</button>
			</div>

			{log && <pre className="log">{log}</pre>}
		</div>
	)
}