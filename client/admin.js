document.addEventListener('DOMContentLoaded', () => {
  loadAdminSummary();
  loadAdminAssets();

  document.getElementById('reset-btn').addEventListener('click', async () => {
    if (!confirm('Reset the entire portfolio? This cannot be undone.')) return;
    const msg = document.getElementById('admin-message');
    try {
      const res = await fetch('/api/portfolio/assets', { method: 'DELETE' });
      if (!res.ok) {
        msg.textContent = 'Failed to reset portfolio';
        msg.style.color = '#f87171';
        return;
      }
      msg.textContent = 'Portfolio reset successfully';
      msg.style.color = '#4ade80';
      hideEditForm();
      loadAdminSummary();
      loadAdminAssets();
    } catch {
      msg.textContent = 'Network error';
      msg.style.color = '#f87171';
    }
  });

  document.getElementById('edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value.trim();
    const type = document.getElementById('edit-type').value;
    const value = parseFloat(document.getElementById('edit-value').value);
    const msg = document.getElementById('edit-message');

    try {
      const res = await fetch(`/api/portfolio/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, value }),
      });
      if (!res.ok) {
        const err = await res.json();
        msg.textContent = err.error || 'Failed to update asset';
        msg.style.color = '#f87171';
        return;
      }
      msg.textContent = 'Asset updated successfully';
      msg.style.color = '#4ade80';
      hideEditForm();
      loadAdminSummary();
      loadAdminAssets();
    } catch {
      msg.textContent = 'Network error';
      msg.style.color = '#f87171';
    }
  });

  document.getElementById('cancel-edit').addEventListener('click', hideEditForm);
});

async function loadAdminSummary() {
  const container = document.getElementById('admin-summary-content');
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

async function loadAdminAssets() {
  const tbody = document.getElementById('admin-assets-body');
  try {
    const res = await fetch('/api/portfolio');
    const data = await res.json();
    if (data.assets.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No assets in portfolio</td></tr>';
      return;
    }
    tbody.innerHTML = data.assets
      .map(
        (a) => `<tr data-id="${a.id}">
        <td>${a.id}</td>
        <td>${a.name}</td>
        <td>${a.type}</td>
        <td>$${a.value.toLocaleString()}</td>
        <td class="actions">
          <button class="btn-edit btn-small" data-id="${a.id}" data-name="${a.name}" data-type="${a.type}" data-value="${a.value}">Edit</button>
          <button class="btn-delete btn-small btn-danger" data-id="${a.id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('.btn-edit').forEach((btn) => {
      btn.addEventListener('click', () => showEditForm(btn.dataset));
    });

    tbody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', () => deleteAsset(btn.dataset.id));
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Unable to load assets</td></tr>';
  }
}

function showEditForm({ id, name, type, value }) {
  document.getElementById('edit-id').value = id;
  document.getElementById('edit-name').value = name;
  document.getElementById('edit-type').value = type;
  document.getElementById('edit-value').value = value;
  document.getElementById('edit-message').textContent = '';
  document.getElementById('edit-asset-section').style.display = '';
  document.getElementById('edit-asset-section').scrollIntoView({ behavior: 'smooth' });
}

function hideEditForm() {
  document.getElementById('edit-asset-section').style.display = 'none';
  document.getElementById('edit-form').reset();
  document.getElementById('edit-message').textContent = '';
}

async function deleteAsset(id) {
  if (!confirm(`Delete asset #${id}?`)) return;
  const msg = document.getElementById('admin-message');
  try {
    const res = await fetch(`/api/portfolio/assets/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      msg.textContent = err.error || 'Failed to delete asset';
      msg.style.color = '#f87171';
      return;
    }
    msg.textContent = `Asset #${id} deleted`;
    msg.style.color = '#4ade80';
    loadAdminSummary();
    loadAdminAssets();
  } catch {
    msg.textContent = 'Network error';
    msg.style.color = '#f87171';
  }
}
