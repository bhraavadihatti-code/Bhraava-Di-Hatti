import { Order } from '../types';

const TELEGRAM_BOT_TOKEN = "8752135508:AAF2X43YeNzGKFazG9cFzMUNzVgnMs3Vju0";

/**
 * Sends an automated Telegram notification when an order is created or updated.
 * It calls the server endpoint first (which handles chat ID detection & server-side dispatching)
 * and falls back to direct Telegram API call if a custom chatId is saved in localStorage.
 */
export async function sendOrderTelegramNotification(order: Order, title: string = "🚨 NEW ORDER RECEIVED"): Promise<boolean> {
  try {
    // 1. First trigger server-side dispatch
    const serverRes = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });

    if (serverRes.ok) {
      console.log(`Order ${order.id} sent to server and queued for Telegram notification.`);
    }

    // 2. Also check if client has a saved Chat ID for direct push as backup
    let chatId = '';
    try {
      const savedSettings = localStorage.getItem('bdh_shop_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.telegramChatId) chatId = parsed.telegramChatId;
      }
    } catch (e) {}

    if (chatId) {
      const itemsSummary = (order.items || []).map((i, idx) => 
        `  ${idx + 1}. <b>${i.product?.name || 'Suit Item'}</b>\n     Color: ${i.selectedColor || 'Standard'} | Size: ${i.selectedSize || 'Standard'}\n     Qty: ${i.quantity} x ₹${i.product?.price || 0}`
      ).join('\n\n');

      const messageText = 
`<b>${title}</b>
🏬 <b>Shop:</b> Bhraava Di Hatti (Jai Durga Cloth Emporium)

📦 <b>Order ID:</b> <code>${order.id}</code>
💳 <b>UTS/UTR Ref:</b> <code>${order.utsNumber || 'N/A'}</code>
💵 <b>Total Amount:</b> ₹${order.totalAmount}

👤 <b>Customer Details:</b>
• <b>Name:</b> ${order.customer?.fullName || 'N/A'}
• <b>Phone:</b> <code>${order.customer?.phone || 'N/A'}</code>
• <b>Address:</b> ${order.customer?.address || ''}, ${order.customer?.city || ''}, ${order.customer?.state || ''} - ${order.customer?.pincode || ''}
${order.customer?.notes ? `• <b>Notes:</b> ${order.customer.notes}\n` : ''}
🛒 <b>Items Ordered:</b>
${itemsSummary}

📅 <b>Time:</b> ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
⚡ <b>Status:</b> ${order.status?.toUpperCase() || 'PENDING'}

<i>Bhraava Di Hatti - Instant Store Alert</i>`;

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });
    }

    return true;
  } catch (err) {
    console.warn('Error sending Telegram order notification:', err);
    return false;
  }
}
