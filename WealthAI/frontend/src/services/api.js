// Uses environment variable for production, falls back to localhost for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export const WealthAPI = {
    async getMarketData(symbol) {
        try {
            const response = await fetch(`${API_BASE_URL}/market-data/${symbol}`);
            if (!response.ok) throw new Error("API call failed");
            return await response.json();
        } catch (error) {
            console.error(`Error fetching live data for ${symbol}:`, error);
            return { c: 0 };
        }
    },
    async searchSymbols(query) {
        if (!query || query.trim().length === 0) return [];
        try {
            const response = await fetch(`${API_BASE_URL}/search-symbols?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Search API failed");
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error(`Error searching symbols for ${query}:`, error);
            return [];
        }
    },
    async deleteAsset(assetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/portfolio/${assetId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error("Failed to delete asset");
            return await response.json();
        } catch (error) {
            console.error("Error deleting asset:", error);
            return { success: false, error: error.message };
        }
    },

    async getPortfolio() {
        try {
            const response = await fetch(`${API_BASE_URL}/portfolio`);
            if (!response.ok) throw new Error("Portfolio fetch failed");
            return await response.json();
        } catch (error) {
            console.error("Error linking portfolio matrices:", error);
            return { holdings: [], summary: { total_investment: 0, total_current_value: 0, total_pnl: 0, total_pnl_pct: 0 } };
        }
    },
    async addTransaction(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error("Transaction commit failed");
            return await response.json();
        } catch (error) {
            console.error("Error sync processing asset allocation:", error);
            return { success: false, error: error.message };
        }
    }
};