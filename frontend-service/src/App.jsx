import { useState, useEffect } from 'react';
import './App.css';
import { Chart as ChartJS, registerables } from 'chart.js';
import { connectWebSocket, addMessageHandler, removeMessageHandler, processReviewData } from './utils/dataUtils';
import SentimentDashboard from './components/SentimentDashboard';
ChartJS.register(...registerables);

import Header from './components/Header';
import RealtimeFeed from './components/RealtimeFeed';
import Dashboard from './components/Dashboard';

export default function App() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'enabled');
  const [activeTab, setActiveTab] = useState('realtime');
  const [isPaused, setIsPaused] = useState(false);
  const [positiveCount, setPositiveCount] = useState(0);
  const [neutralCount, setNeutralCount] = useState(0);
  const [negativeCount, setNegativeCount] = useState(0);
  const [asinFilter, setAsinFilter] = useState('');
  const [reviews, setReviews] = useState([]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode ? 'enabled' : 'disabled');
  };

  const addReviewToFeed = (review) => {
    if (!review) return;
    console.log("Adding review to feed:", review);
    
    // Check the sentiment and increment the appropriate counter
    if (review.sentiment === 'positive') {
      setPositiveCount(prev => prev + 1);
    } else if (review.sentiment === 'neutral') {
      setNeutralCount(prev => prev + 1);
    } else if (review.sentiment === 'negative') {
      setNegativeCount(prev => prev + 1);
    } else {
      console.warn("Unknown sentiment value:", review.sentiment);
    }
    
    setReviews(prev => [review, ...prev].slice(0, 100));
  };

  const filteredReviews = reviews.filter(review => 
    review && review.asin && review.asin.toLowerCase().includes((asinFilter || '').toLowerCase())
  );

  useEffect(() => {
    // Connect to WebSocket when component mounts
    connectWebSocket();

    // Handler for incoming messages
    const handleMessage = (message) => {
      if (!isPaused && (message.type === 'new_review' || message.type === 'new_sentiment')) {
        const processedReview = processReviewData(message);
        if (processedReview) {
          addReviewToFeed(processedReview);
        }
      }
    };

    // Add message handler
    addMessageHandler(handleMessage);

    // Cleanup when component unmounts
    return () => {
      removeMessageHandler(handleMessage);
    };
  }, [isPaused]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <Header
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {activeTab === 'realtime' ? (
          <RealtimeFeed
            reviews={reviews}
            filteredReviews={filteredReviews}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            asinFilter={asinFilter}
            setAsinFilter={setAsinFilter}
            positiveCount={positiveCount}
            neutralCount={neutralCount}
            negativeCount={negativeCount}
          />
        ) : activeTab === 'dashboard' ? (
          <Dashboard
            positiveCount={positiveCount}
            neutralCount={neutralCount}
            negativeCount={negativeCount}
          />
        ): (
          <SentimentDashboard />
        )}
      </div>
    </div>
  );
}