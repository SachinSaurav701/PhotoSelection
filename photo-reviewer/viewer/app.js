const STATUS_ORDER = ['selected', 'pending', 'rejected']

function nextStatus(current) {
	const idx = STATUS_ORDER.indexOf(current)
	return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length]
}

async function loadPhotos() {
	const res = await fetch('./photos.json', { cache: 'no-store' })
	return await res.json()
}

function render(photos, filterValue) {
	const grid = document.getElementById('grid')
	grid.innerHTML = ''
	const toShow = photos.filter(p => filterValue === 'all' ? true : p.status === filterValue)
	for (const p of toShow) {
		const card = document.createElement('div')
		card.className = `card ${p.status}`
		const img = document.createElement('img')
		img.loading = 'lazy'
		img.src = p.relPath
		const meta = document.createElement('div')
		meta.className = 'meta'
		const title = document.createElement('div')
		title.textContent = p.filename
		const bar = document.createElement('div')
		bar.className = 'bar'
		const statusBtn = document.createElement('button')
		statusBtn.textContent = p.status
		statusBtn.onclick = () => {
			p.status = nextStatus(p.status)
			statusBtn.textContent = p.status
			card.className = `card ${p.status}`
		}
		const comment = document.createElement('input')
		comment.placeholder = 'Add comment'
		comment.value = p.comment || ''
		comment.onchange = () => { p.comment = comment.value }
		bar.appendChild(statusBtn)
		bar.appendChild(comment)
		meta.appendChild(title)
		meta.appendChild(bar)
		card.appendChild(img)
		card.appendChild(meta)
		grid.appendChild(card)
	}
}

function exportTxt(photos) {
	const lines = photos.map(p => `${p.filename}\t${p.status}\t${p.comment || ''}`)
	const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
	const a = document.createElement('a')
	a.href = URL.createObjectURL(blob)
	a.download = 'selection.txt'
	a.click()
	URL.revokeObjectURL(a.href)
}

async function main() {
	const photos = await loadPhotos()
	let filterValue = 'all'
	const filter = document.getElementById('filter')
	filter.onchange = () => {
		filterValue = filter.value
		render(photos, filterValue)
	}
	document.getElementById('export').onclick = () => exportTxt(photos)
	render(photos, filterValue)
}

main()