const setAlerts = (req, res) => {
    const { email, telegramId } = req.body;

    if (!email && !telegramId) {
        return res.status(400).json({ error: 'At least one of email or Telegram ID is required' });
    }

    // Mock implementation: In a real app, you'd integrate with Telegram API or an email service
    const message = `Alert settings saved! Notifications will be sent to ${
        email ? `email: ${email}` : ''
    }${email && telegramId ? ' and ' : ''}${telegramId ? `Telegram ID: ${telegramId}` : ''}.`;
    res.json({ message });
};

module.exports = { setAlerts };