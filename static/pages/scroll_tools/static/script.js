// Parse location URL
const url = new URL(window.location);

// Hide metabox when embedding
if (url.searchParams.has('embed')) {
	document.documentElement.classList.add('is-embed');
}

// Browsers that don’t support anchoring get a CSS fix based on a class on the root
if (!("anchorName" in document.documentElement.style)) {
	document.documentElement.classList.add('no-anchor');
}

const onLoad = () => {
	// Show/Hide info dialog upon button click
	document.querySelector('#infobox-toggle').addEventListener('click', (e) => {
		document.querySelector('dialog#infobox').showModal();
	});

	document.querySelectorAll('.card').forEach($card => {
		$card.addEventListener('click', (e) => {
			if (e.target.tagName.toLowerCase() === 'a') return;
			window.location.href = $card.querySelector(':scope a').getAttribute('href');
		});
	})

	// Jank Toggle
	let jankInterval = null;
	const $jankToggle = document.querySelector('input[type="checkbox"]#jank');
	$jankToggle?.addEventListener('change', function() {
		if (!this.checked) {
			clearInterval(jankInterval);
			jankInterval = null;
		} else {
			jankInterval = setInterval(() => {let start = performance.now(); while (performance.now() < start + 500);}, 1000);
			$jankToggle.innerText = 'Stop jank';
		}
	});
};

window.addEventListener('DOMContentLoaded', onLoad);
