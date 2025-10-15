import axios from 'axios';
import { Portfolio, PortfolioAnalysis } from '../types/portfolio';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const portfolioApi = {
  uploadJSON: async (portfolioData: Portfolio) => {
    const response = await api.post('/portfolio/upload', portfolioData);
    return response.data;
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/portfolio/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/portfolio');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/portfolio/${id}`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/portfolio/${id}`);
    return response.data;
  }
};

export const insightsApi = {
  analyzePortfolio: async (id: string): Promise<{ success: boolean; analysis: PortfolioAnalysis }> => {
    const response = await api.get(`/insights/portfolio/${id}`);
    return response.data;
  },

  getSecurityData: async (ticker: string) => {
    const response = await api.get(`/insights/security/${ticker}`);
    return response.data;
  },

  getResearch: async (query: string) => {
    const response = await api.post('/insights/research', { query });
    return response.data;
  },

  getPortfolioNews: async (id: string) => {
    const response = await api.get(`/insights/news/${id}`);
    return response.data;
  }
};

export const chatApi = {
  sendMessage: async (portfolioId: string, message: string, conversationId?: string) => {
    const response = await api.post(`/chat/portfolio/${portfolioId}`, {
      message,
      conversationId
    });
    return response.data;
  },

  clearConversation: async (conversationId: string) => {
    const response = await api.delete(`/chat/conversation/${conversationId}`);
    return response.data;
  }
};
