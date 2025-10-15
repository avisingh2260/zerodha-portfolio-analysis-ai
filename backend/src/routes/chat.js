import express from 'express';
import { chatService } from '../services/chat.js';

const router = express.Router();

// Chat with portfolio context
router.post('/portfolio/:id', async (req, res) => {
  try {
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await chatService.chat(
      req.params.id,
      message.trim(),
      conversationId
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message'
    });
  }
});

// Clear conversation history
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    chatService.clearConversation(req.params.conversationId);
    res.json({
      success: true,
      message: 'Conversation cleared'
    });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
