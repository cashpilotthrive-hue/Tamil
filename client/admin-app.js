let sessionId = localStorage.getItem('adminSession');

document.addEventListener('DOMContentLoaded', () => {
  if (sessionId) {
    showAdminPage();
  } else {
    showLoginPage();
  }
});

function showLoginPage() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('admin-page').classList.add('hidden');
  setupLoginForm();
}

function showAdminPage() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('admin-page').classList.remove('hidden');
  loadStats();
  loadAdminAssets();
  setupAdminHandlers();
}

function setupLoginForm() {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        msg.textContent = err.error || 'Login failed';
        msg.style.color = '#f87171';
        return;
      }

      const data = await res.json();
      sessionId = data.sessionId;
      localStorage.setItem('adminSession', sessionId);
      showAdminPage();
    } catch {
      msg.textContent = 'Network error';
      msg.style.color = '#f87171';
    }
  });
}

function setupAdminHandlers() {
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('clear-portfolio-btn').addEventListener('click', clearPortfolio);
  document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
  document.getElementById('edit-form').addEventListener('submit', saveEdit);
}

async function logout() {
  try {
    await fetch('/admin/logout', {
      method: 'POST',
      headers: { 'x-admin-session': sessionId },
    });
  } catch {
    // Ignore network errors
  }
  localStorage.removeItem('adminSession');
  sessionId = null;
  showLoginPage();
}

async function loadStats() {
  const container = document.getElementById('stats-content');
  try {
    const res = await fetch('/admin/portfolio/stats', {
      headers: { 'x-admin-session': sessionId },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const data = await res.json();
    let html = `
      <div class="stat-item">
        <h3>Total Assets</h3>
        <p>${data.totalAssets}</p>
      </div>
      <div class="stat-item">
        <h3>Total Value</h3>
        <p>$${data.totalValue.toLocaleString()}</p>
      </div>
    `;

    for (const [type, info] of Object.entries(data.assetTypes)) {
      html += `
        <div class="stat-item">
          <h3>${type}</h3>
          <p>${info.count} assets</p>
          <p style="font-size: 1rem; color: #94a3b8;">
            Total: $${info.totalValue.toLocaleString()}<br>
            Avg: $${info.avgValue.toFixed(2)}
          </p>
        </div>
      `;
    }

    container.innerHTML = html;
  } catch {
    container.innerHTML = '<p>Unable to load statistics</p>';
  }
}

async function loadAdminAssets() {
  const tbody = document.getElementById('admin-assets-body');
  try {
    const res = await fetch('/api/portfolio', {
      headers: { 'x-admin-session': sessionId },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const data = await res.json();
    tbody.innerHTML = data.assets
      .map(
        (a) => `<tr>
        <td>${a.id}</td>
        <td>${a.name}</td>
        <td>${a.type}</td>
        <td>$${a.value.toLocaleString()}</td>
        <td>
          <button class="btn-primary btn-small" onclick="editAsset(${a.id}, '${a.name}', '${a.type}', ${a.value})">Edit</button>
          <button class="btn-danger btn-small" onclick="deleteAsset(${a.id})">Delete</button>
        </td>
      </tr>`
      )
      .join('');
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Unable to load assets</td></tr>';
  }
}

async function deleteAsset(id) {
  if (!confirm('Are you sure you want to delete this asset?')) return;

  try {
    const res = await fetch(`/admin/portfolio/assets/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-session': sessionId },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      alert('Failed to delete asset');
      return;
    }

    loadStats();
    loadAdminAssets();
  } catch {
    alert('Network error');
  }
}

async function clearPortfolio() {
  if (!confirm('Are you sure you want to delete ALL assets? This cannot be undone!')) return;

  try {
    const res = await fetch('/admin/portfolio/clear', {
      method: 'DELETE',
      headers: { 'x-admin-session': sessionId },
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      alert('Failed to clear portfolio');
      return;
    }

    loadStats();
    loadAdminAssets();
  } catch {
    alert('Network error');
  }
}

function editAsset(id, name, type, value) {
  document.getElementById('edit-asset-id').value = id;
  document.getElementById('edit-name').value = name;
  document.getElementById('edit-type').value = type;
  document.getElementById('edit-value').value = value;
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
}

async function saveEdit(e) {
  e.preventDefault();
  const id = document.getElementById('edit-asset-id').value;
  const name = document.getElementById('edit-name').value.trim();
  const type = document.getElementById('edit-type').value;
  const value = parseFloat(document.getElementById('edit-value').value);

  try {
    const res = await fetch(`/admin/portfolio/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-session': sessionId,
      },
      body: JSON.stringify({ name, type, value }),
    });

    if (res.status === 401) {
      logout();
      return;
    }

    if (!res.ok) {
      alert('Failed to update asset');
      return;
    }

    closeEditModal();
    loadStats();
    loadAdminAssets();
  } catch {
    alert('Network error');
  }
}
