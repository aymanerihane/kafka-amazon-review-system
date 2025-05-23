import { useEffect, useState } from 'react';
import { connectWebSocket, addMessageHandler, removeMessageHandler } from '../utils/dataUtils';

export default function DashboardFilters({ onFilterChange }) {
  const [products, setProducts] = useState({});
  const [filters, setFilters] = useState({
    timeRange: '7d',
    asin: 'all',
    sentiment: 'all'
  });

  useEffect(() => {
    // Connect to WebSocket
    connectWebSocket();

    // Handle incoming messages
    const handleMessage = (message) => {
      if (message.type === 'new_sentiment' || message.type === 'new_review') {
        const data = message.data || message;
        if (!data || !data.asin) return;
        
        // Map sentiment value to standard category
        let sentimentCategory = 'neutral';
        if (data.sentiment === 2 || data.sentiment === 'positive' || data.sentiment_label === 'Positive') {
          sentimentCategory = 'positive';
        } else if (data.sentiment === 0 || data.sentiment === 'negative' || data.sentiment_label === 'Negative') {
          sentimentCategory = 'negative';
        }
        
        setProducts(prevProducts => {
          const newProducts = { ...prevProducts };
          const asin = data.asin;
          
          if (!newProducts[asin]) {
            newProducts[asin] = {
              asin: asin,
              title: data.title || data.summary || `Product ${asin}`,
              reviews: []
            };
          }
          
          const timestamp = new Date(data.processed_at || data.prediction_time || new Date()).getTime();
          
          newProducts[asin].reviews.push({
            sentiment: sentimentCategory,
            timestamp: timestamp
          });
          
          return newProducts;
        });
      }
    };

    addMessageHandler(handleMessage);

    return () => {
      removeMessageHandler(handleMessage);
    };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  // Get unique ASINs for the dropdown
  const productOptions = Object.entries(products)
    .map(([asin, data]) => ({
      value: asin,
      label: data.title ? `${asin}: ${data.title}` : asin
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div>
        <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
        <select
          id="timeRange"
          name="timeRange"
          value={filters.timeRange}
          onChange={handleFilterChange}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div>
        <label htmlFor="asin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Filter</label>
        <select
          id="asin"
          name="asin"
          value={filters.asin}
          onChange={handleFilterChange}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Products</option>
          {productOptions.map(product => (
            <option key={product.value} value={product.value}>
              {product.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="sentiment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sentiment</label>
        <select
          id="sentiment"
          name="sentiment"
          value={filters.sentiment}
          onChange={handleFilterChange}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>
      <div className="flex items-end">
        <button
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition dark:bg-indigo-700 dark:hover:bg-indigo-600"
          onClick={() => onFilterChange && onFilterChange(filters)}
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}