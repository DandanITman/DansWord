const REPO = 'DandanITman/DansWord';
const FALLBACK_RELEASES = `https://github.com/${REPO}/releases/latest`;

async function loadLatestRelease() {
  const btnTop = document.getElementById('download-btn');
  const btnBottom = document.getElementById('download-btn-bottom');
  const meta = document.getElementById('download-meta');

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!res.ok) throw new Error('No release yet');

    const release = await res.json();
    const asset =
      release.assets?.find((a) => /\.exe$/i.test(a.name)) ??
      release.assets?.find((a) => /\.msi$/i.test(a.name));

    const href = asset?.browser_download_url ?? release.html_url;
    const label = asset
      ? `Download ${asset.name} (${prettySize(asset.size)})`
      : 'View latest release';

    [btnTop, btnBottom].forEach((btn) => {
      if (!btn) return;
      btn.href = href;
      if (btn === btnBottom) btn.textContent = label;
    });

    meta.textContent = asset
      ? `Latest: v${release.tag_name.replace(/^v/, '')} · Windows installer`
      : `Release ${release.tag_name} — open Releases page to download`;
  } catch {
    [btnTop, btnBottom].forEach((btn) => {
      if (btn) btn.href = FALLBACK_RELEASES;
    });
    meta.textContent =
      'First release coming soon — star the repo on GitHub to get notified, or build from source today.';
  }
}

function prettySize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

loadLatestRelease();
