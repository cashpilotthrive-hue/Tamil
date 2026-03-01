document.addEventListener('DOMContentLoaded', () => {
  loadSummary();
  loadAssets();

  const form = document.getElementById('asset-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('asset-name').value.trim();
    const type = document.getElementById('asset-type').value;
    const value = parseFloat(document.getElementById('asset-value').value);
    const msg = document.getElementById('form-message');

    try {
      const res = await fetch('/api/portfolio/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, value }),
      });
      if (!res.ok) {
        const err = await res.json();
        msg.textContent = err.error || 'Failed to add asset';
        msg.style.color = '#f87171';
        return;
      }
      msg.textContent = 'Asset added successfully';
      msg.style.color = '#4ade80';
      form.reset();
      loadSummary();
      loadAssets();
    } catch {
      msg.textContent = 'Network error';
      msg.style.color = '#f87171';
    }
  });
});

async function loadSummary() {
  const container = document.getElementById('summary-content');
  try {
    const res = await fetch('/api/portfolio/summary');
    const data = await res.json();
    container.innerHTML = `
      <p><strong>Total Assets:</strong> ${data.totalAssets}</p>
      <p><strong>Total Value:</strong> $${data.totalValue.toLocaleString()}</p>
    `;
  } catch {
    container.innerHTML = '<p>Unable to load summary</p>';
  }
}

async function loadAssets() {
  const tbody = document.getElementById('assets-body');
  try {
    const res = await fetch('/api/portfolio');
    const data = await res.json();
    tbody.innerHTML = data.assets
      .map(
        (a) => `<tr>
        <td>${a.id}</td>
        <td>${a.name}</td>
        <td>${a.type}</td>
        <td>$${a.value.toLocaleString()}</td>
      </tr>`
      )
      .join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="4">Unable to load assets</td></tr>';
  }
}
