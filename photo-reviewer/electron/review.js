import path from 'node:path'
import fs from 'node:fs'
import fsExtra from 'fs-extra'
import Jimp from 'jimp'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png'])

async function enumerateImagesRecursive(dirPath, baseDir = dirPath, out = []) {
	const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })
	for (const e of entries) {
		const abs = path.join(dirPath, e.name)
		if (e.isDirectory()) {
			await enumerateImagesRecursive(abs, baseDir, out)
		} else if (e.isFile()) {
			const ext = path.extname(e.name).toLowerCase()
			if (IMAGE_EXTS.has(ext)) {
				const rel = path.relative(baseDir, abs)
				out.push({ abs, rel })
			}
		}
	}
	return out.sort((a, b) => a.rel.localeCompare(b.rel))
}

async function compressImage(inputPath, outputPath, { quality, maxSize }) {
	const image = await Jimp.read(inputPath)
	const w = image.getWidth()
	const h = image.getHeight()
	let newW = w
	let newH = h
	if (w > h && w > maxSize) {
		newW = maxSize
		newH = Math.round((h / w) * newW)
	} else if (h >= w && h > maxSize) {
		newH = maxSize
		newW = Math.round((w / h) * newH)
	}
	image.resize(newW, newH)
	if (inputPath.toLowerCase().endsWith('.png')) {
		await image.quality(quality).write(outputPath.replace(/\.png$/i, '.jpg'))
		return outputPath.replace(/\.png$/i, '.jpg')
	} else {
		await image.quality(quality).write(outputPath)
		return outputPath
	}
}

export async function generateReviewPackage({ sourceDir, outputDir, options }) {
	const { quality = 60, maxSize = 1600 } = options || {}
	const images = await enumerateImagesRecursive(sourceDir)
	if (images.length === 0) return { count: 0, outputDir }

	const pkgDir = path.join(outputDir, `review-${Date.now()}`)
	const thumbsDir = path.join(pkgDir, 'photos')
	await fsExtra.ensureDir(thumbsDir)

	const selectionRecords = []
	let index = 0
	for (const item of images) {
		index += 1
		const base = item.rel
		const dest = path.join(thumbsDir, base).replace(/\\/g, '/')
		await fsExtra.ensureDir(path.dirname(dest))
		const outPath = await compressImage(item.abs, dest, { quality, maxSize })
		const rel = path.relative(pkgDir, outPath).replace(/\\/g, '/')
		selectionRecords.push({ id: index.toString().padStart(5, '0'), filename: base, relPath: rel, status: 'pending', comment: '' })
	}

	await fsExtra.copy(path.join(process.cwd(), 'viewer'), path.join(pkgDir))
	await fs.promises.writeFile(path.join(pkgDir, 'photos.json'), JSON.stringify(selectionRecords, null, 2), 'utf8')

	const txtLines = selectionRecords.map(r => `${r.filename}\t${r.status}\t${r.comment}`)
	await fs.promises.writeFile(path.join(pkgDir, 'selection_template.txt'), txtLines.join('\n'), 'utf8')

	return { count: images.length, outputDir: pkgDir }
}