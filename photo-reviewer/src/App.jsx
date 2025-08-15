import React, { useState } from 'react'

function Row({ label, value, onPick, placeholder, type = 'text', disabled = false }) {
	return (
		<div className="row">
			<label>{label}</label>
			<input type={type} value={value} onChange={() => {}} placeholder={placeholder} disabled />
			<button onClick={onPick} disabled={disabled}>Browse</button>
		</div>
	)
}

export default function App() {
	const [tab, setTab] = useState('create')

	// Create package state
	const [sourceDir, setSourceDir] = useState('')
	const [outputDir, setOutputDir] = useState('')
	const [quality, setQuality] = useState(60)
	const [maxSize, setMaxSize] = useState(1600)
	const [isGenerating, setIsGenerating] = useState(false)
	const [genLog, setGenLog] = useState('')

	// Apply selection state
	const [selectionFile, setSelectionFile] = useState('')
	const [originalsDir, setOriginalsDir] = useState('')
	const [applyOutputDir, setApplyOutputDir] = useState('')
	const [isApplying, setIsApplying] = useState(false)
	const [applyLog, setApplyLog] = useState('')

	async function pickSourceDir() {
		const dir = await window.api.selectFolder()
		if (dir) setSourceDir(dir)
	}
	async function pickOutputDir() {
		const dir = await window.api.selectFolder()
		if (dir) setOutputDir(dir)
	}
	async function pickSelectionFile() {
		const file = await window.api.selectFile([{ name: 'Selection Text', extensions: ['txt'] }])
		if (file) setSelectionFile(file)
	}
	async function pickOriginalsDir() {
		const dir = await window.api.selectFolder()
		if (dir) setOriginalsDir(dir)
	}
	async function pickApplyOutputDir() {
		const dir = await window.api.selectFolder()
		if (dir) setApplyOutputDir(dir)
	}

	async function handleGenerate() {
		if (!sourceDir || !outputDir) {
			setGenLog('Please choose both Source and Output folders.')
			return
		}
		setIsGenerating(true)
		setGenLog('Starting...')
		try {
			const res = await window.api.generateReviewPackage({
				sourceDir,
				outputDir,
				options: { quality: Number(quality), maxSize: Number(maxSize) }
			})
			setGenLog(`Done. ${res.count} photos processed. Review folder: ${res.outputDir}`)
		} catch (e) {
			setGenLog(`Error: ${e.message || e}`)
		} finally {
			setIsGenerating(false)
		}
	}

	async function handleApply() {
		if (!selectionFile || !originalsDir || !applyOutputDir) {
			setApplyLog('Please choose selection file, originals folder and output folder.')
			return
		}
		setIsApplying(true)
		setApplyLog('Copying originals...')
		try {
			const res = await window.api.applySelection({
				selectionFile,
				originalsDir,
				outputDir: applyOutputDir
			})
			setApplyLog(`Done. ${res.copied} files copied to ${res.outputDir}`)
		} catch (e) {
			setApplyLog(`Error: ${e.message || e}`)
		} finally {
			setIsApplying(false)
		}
	}

	return (
		<div className="container">
			<header>
				<h1>Photo Reviewer</h1>
				<nav>
					<button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Create Review Package</button>
					<button className={tab === 'apply' ? 'active' : ''} onClick={() => setTab('apply')}>Apply Selection</button>
				</nav>
			</header>

			{tab === 'create' && (
				<section>
					<Row label="Source folder" value={sourceDir} onPick={pickSourceDir} placeholder="Choose source" />
					<Row label="Output folder" value={outputDir} onPick={pickOutputDir} placeholder="Choose output" />
					<div className="row">
						<label>Quality (1-100)</label>
						<input type="number" value={quality} onChange={(e) => setQuality(e.target.value)} min={1} max={100} />
						<label>Max size (px)</label>
						<input type="number" value={maxSize} onChange={(e) => setMaxSize(e.target.value)} min={400} max={8000} />
					</div>
					<div className="actions">
						<button onClick={handleGenerate} disabled={isGenerating}>{isGenerating ? 'Generating…' : 'Generate Review Package'}</button>
					</div>
					{genLog && <pre className="log">{genLog}</pre>}
				</section>
			)}

			{tab === 'apply' && (
				<section>
					<Row label="Selection file (.txt)" value={selectionFile} onPick={pickSelectionFile} placeholder="Choose selection.txt" />
					<Row label="Originals folder" value={originalsDir} onPick={pickOriginalsDir} placeholder="Choose originals" />
					<Row label="Output folder" value={applyOutputDir} onPick={pickApplyOutputDir} placeholder="Choose output" />
					<div className="actions">
						<button onClick={handleApply} disabled={isApplying}>{isApplying ? 'Copying…' : 'Copy Selected Originals'}</button>
					</div>
					{applyLog && <pre className="log">{applyLog}</pre>}
				</section>
			)}
		</div>
	)
}