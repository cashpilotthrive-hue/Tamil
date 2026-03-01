document.addEventListener('DOMContentLoaded', () => {
  const savedKey = sessionStorage.getItem('adminKey');
  if (savedKey) {
    document.getElementById('admin-key-input').value = savedKey;
    document.getElementById('admin-key-message').textContent = 'Admin key loaded from storage';
    document.getElementById('admin-key-message').style.color = '#4ade80';
  }

  document.getElementById('admin-key-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const key = document.getElementById('admin-key-input').value.trim();
    const msg = document.getElementById('admin-key-message');
    if (key) {
      sessionStorage.setItem('adminKey', key);
      msg.textContent = 'Admin key saved';
      msg.style.color = '#4ade80';
    } else {
      sessionStorage.removeItem('adminKey');
      msg.textContent = 'Admin key cleared';
      msg.style.color = '#f87171';
    }
  });

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
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': sessionStorage.getItem('adminKey') || '',
        },
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
        <td><button class="delete-btn" data-id="${a.id}">Delete</button></td>
      </tr>`
      )
      .join('');
    tbody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        try {
          const delRes = await fetch(`/api/portfolio/assets/${id}`, {
            method: 'DELETE',
            headers: { 'X-Admin-Key': sessionStorage.getItem('adminKey') || '' },
          });
          if (delRes.status === 204) {
            loadSummary();
            loadAssets();
          } else {
            const err = await delRes.json();
            alert(err.error || 'Failed to delete asset');
          }
        } catch {
          alert('Network error');
        }
      });
    });
  } catch {
    tbody.innerHTML = '<tr><td colspan="5">Unable to load assets</td></tr>';
  }
}
