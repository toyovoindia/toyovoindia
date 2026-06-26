const currency = (value) => `Rs ${Number(value || 0).toFixed(2)}`

const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const printOrderInvoice = (order) => {
  if (!order) return

  const invoiceWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!invoiceWindow) return

  const rows = (order.items || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.sku || '-')}</td>
      <td>${item.qty}</td>
      <td>${currency(item.price)}</td>
      <td>${currency(item.total || (Number(item.price || 0) * Number(item.qty || 0)))}</td>
    </tr>
  `).join('')

  const htmlContent = `
    <!doctype html>
    <html>
      <head>
        <title>Invoice ${escapeHtml(order.orderNumber)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #222; }
          h1, h2, h3, p { margin: 0; }
          .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px; }
          .muted { color: #666; font-size: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 24px 0; }
          .card { border: 1px solid #ddd; border-radius: 12px; padding: 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border-bottom: 1px solid #eee; padding: 12px 8px; text-align: left; font-size: 13px; }
          th { background: #fafafa; text-transform: uppercase; font-size: 11px; letter-spacing: .08em; }
          .totals { margin-top: 24px; margin-left: auto; width: 320px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .total { font-weight: 700; font-size: 18px; border-top: 1px solid #ddd; margin-top: 8px; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>TOYOVOINDIA</h1>
            <p class="muted">Invoice / Receipt</p>
          </div>
          <div style="text-align:right">
            <h2>${escapeHtml(order.orderNumber)}</h2>
            <p class="muted">Order Date: ${escapeHtml(order.date)}</p>
            <p class="muted">Status: ${escapeHtml(order.statusLabel || order.status || '')}</p>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <h3>Customer</h3>
            <p>${escapeHtml(order.customerName || '')}</p>
            <p class="muted">${escapeHtml(order.customerEmail || '')}</p>
            <p class="muted">Phone: ${escapeHtml(order.shippingAddress?.phone || order.customerPhone || order.phone || '-')}</p>
          </div>
          <div class="card">
            <h3>Delivery</h3>
            <p>${escapeHtml(order.destination || '-')}</p>
            <p class="muted">ETA: ${escapeHtml(order.deliveryDate || '-')}</p>
            <p class="muted">Tracking: ${escapeHtml(order.trackingNumber || '-')}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${currency(order.subtotal)}</span></div>
          <div><span>Shipping</span><span>${currency(order.shipping)}</span></div>
          <div><span>Discount</span><span>- ${currency(order.discount)}</span></div>
          <div class="total"><span>Grand Total</span><span>${currency(order.total)}</span></div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 500);
          }
        </script>
      </body>
    </html>
  `

  try {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const invoiceWindow = window.open(url, '_blank', 'width=900,height=1000')
    
    if (invoiceWindow) {
      invoiceWindow.focus()
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 2000)
    } else {
      // Fallback if popup is blocked
      window.location.href = url
    }
  } catch (error) {
    console.error('Failed to generate invoice:', error)
    alert('Failed to generate invoice document.')
  }
}
