let adminToken = '';

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

  document
    .getElementById('save-admin-token')
    .addEventListener('click', () => {
      const input = document.getElementById('admin-token');
      adminToken = input.value.trim();
      const msg = document.getElementById('admin-message');
      if (!adminToken) {
        msg.textContent = 'Admin token cleared';
        msg.style.color = '#fbbf24';
        return;
      }
      msg.textContent = 'Admin token saved';
      msg.style.color = '#4ade80';
      loadAssets();
    });

  document
    .getElementById('reset-portfolio')
    .addEventListener('click', async () => {
      const msg = document.getElementById('admin-message');
      if (!adminToken) {
        msg.textContent = 'Provide admin token to reset portfolio';
        msg.style.color = '#f87171';
        return;
      }
      try {
        const res = await fetch('/api/admin/reset', {
          method: 'POST',
          headers: { 'x-admin-token': adminToken },
        });
        const data = await res.json();
        if (!res.ok) {
          msg.textContent = data.error || 'Reset failed';
          msg.style.color = '#f87171';
          return;
        }
        msg.textContent = data.message || 'Portfolio reset';
        msg.style.color = '#4ade80';
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
      .map((a) => {
        const action = adminToken
          ? `<button class="delete-btn" data-id="${a.id}">Delete</button>`
          : '<span class="muted">Admin only</span>';
        return `<tr>
          <td>${a.id}</td>
          <td>${a.name}</td>
          <td>${a.type}</td>
          <td>$${a.value.toLocaleString()}</td>
          <td>${action}</td>
        </tr>`;
      })
      .join('');

    if (adminToken) {
      document.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          const id = Number(e.target.dataset.id);
          await deleteAsset(id);
        });
      });
    }
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Unable to load assets</td></tr>';
  }
}

async function deleteAsset(id) {
  const msg = document.getElementById('admin-message');
  if (!adminToken) {
    msg.textContent = 'Provide admin token to delete assets';
    msg.style.color = '#f87171';
    return;
  }
  try {
    const res = await fetch(`/api/portfolio/assets/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-token': adminToken },
    });
    const data = await res.json();
    if (!res.ok) {
      msg.textContent = data.error || 'Delete failed';
      msg.style.color = '#f87171';
      return;
    }
    msg.textContent = 'Asset deleted';
    msg.style.color = '#4ade80';
    loadSummary();
    loadAssets();
  } catch {
    msg.textContent = 'Network error';
    msg.style.color = '#f87171';
  }
}
