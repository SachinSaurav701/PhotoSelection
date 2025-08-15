import path from 'node:path'
import fs from 'node:fs'
import fsExtra from 'fs-extra'

function parseSelectionText(content) {
	const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
	const selections = []
	for (const line of lines) {
		const [filename, status, comment = ''] = line.split('\t')
		if (!filename) continue
		selections.push({ filename, status: (status || 'selected').toLowerCase(), comment })
	}
	return selections
}

export async function applySelectionFile({ selectionFile, originalsDir, outputDir }) {
	const content = await fs.promises.readFile(selectionFile, 'utf8')
	const selections = parseSelectionText(content)
	const selected = selections.filter(s => s.status === 'selected' || s.status === 'accept' || s.status === 'approve' || s.status === 'approved')

	await fsExtra.ensureDir(outputDir)
	let copied = 0
	for (const sel of selected) {
		const src = path.join(originalsDir, sel.filename)
		if (await fsExtra.pathExists(src)) {
			const dest = path.join(outputDir, sel.filename)
			await fsExtra.ensureDir(path.dirname(dest))
			await fsExtra.copy(src, dest)
			copied += 1
		}
	}
	return { copied, outputDir }
}