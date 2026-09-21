const chatService = require('../services/chat.service');

class ChatController {
  async sendMessage(req, res, next) {
    try {
      const applicationId = req.params.applicationId || req.params.id;
      const { message, history, mode } = req.body;
      const reply = await chatService.sendMessage(applicationId, req.user, { message, history, mode });
      return res.status(200).json(reply);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new ChatController();
