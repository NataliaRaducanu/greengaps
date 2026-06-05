import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { searchAll } from '../services/api';
import { MdSearch, MdLocationOn, MdArticle, MdForum, MdAccessTime, MdChat } from 'react-icons/md';
import './Search.css';

const timeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState({ reports: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSearch = async (q) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchAll(q);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setSearchParams({ q: query.trim() });
    }
  };

  const getPriorityColor = (priority) => {
    if (priority === 'High') return '#dc2626';
    if (priority === 'Medium') return '#f97316';
    return '#ca8a04';
  };

  const getCategoryColor = (cat) => {
    const colors = {
      General: '#6b7280', Routes: '#2d7a4f', Safety: '#dc2626',
      Infrastructure: '#2563eb', Events: '#7c3aed', Tips: '#d97706', Other: '#0d9488',
    };
    return colors[cat] || '#6b7280';
  };

  const totalResults = results.reports.length + results.posts.length;
  const filteredReports = activeTab === 'all' || activeTab === 'reports' ? results.reports : [];
  const filteredPosts = activeTab === 'all' || activeTab === 'forum' ? results.posts : [];

  return (
    <div className="search-page">
      <Navbar />

      {/* Hero */}
      <section className="search-hero">
        <div className="search-hero-icon">
          <MdSearch size={32} color="white" />
        </div>
        <h1>Search GreenGaps</h1>
        <p>Find reports and forum discussions across Birmingham's cycling infrastructure</p>

        <form onSubmit={handleSubmit} className="search-hero-form">
          <div className="search-hero-input-wrap">
            <MdSearch size={20} color="#888" className="search-hero-icon-input" />
            <input
              type="text"
              placeholder="Search reports, locations, forum posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-hero-input"
              autoFocus
            />
          </div>
          <button type="submit" className="search-hero-btn">Search</button>
        </form>
      </section>

      {/* Results */}
      <div className="search-main">
        {searched && !loading && (
          <div className="search-summary">
            {totalResults > 0 ? (
              <p>Found <strong>{totalResults}</strong> results for "<strong>{searchParams.get('q')}</strong>"</p>
            ) : (
              <p>No results found for "<strong>{searchParams.get('q')}</strong>"</p>
            )}
          </div>
        )}

        {/* Tabs */}
        {searched && totalResults > 0 && (
          <div className="search-tabs">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
              All ({totalResults})
            </button>
            <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
              <MdArticle size={16} /> Reports ({results.reports.length})
            </button>
            <button className={activeTab === 'forum' ? 'active' : ''} onClick={() => setActiveTab('forum')}>
              <MdForum size={16} /> Forum ({results.posts.length})
            </button>
          </div>
        )}

        {loading && (
          <div className="search-loading">
            <div className="search-spinner" />
            Searching...
          </div>
        )}

        {/* Reports */}
        {filteredReports.length > 0 && (
          <div className="search-section">
            {activeTab === 'all' && <h2><MdArticle size={18} /> Reports</h2>}
            <div className="search-results">
              {filteredReports.map(report => (
                <Link to={`/my-reports/${report.id}`} key={report.id} className="search-result-card">
                  <div className="search-result-left">
                    <div className="search-result-icon report-icon">
                      <MdArticle size={18} color="#2d7a4f" />
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">
                        <span className="search-result-type" style={{ background: getPriorityColor(report.priority) }}>
                          {report.priority}
                        </span>
                        <strong>{report.infrastructure_type}</strong>
                      </div>
                      <div className="search-result-location">
                        <MdLocationOn size={13} color="#888" />
                        <span>{report.location}</span>
                      </div>
                      <p className="search-result-desc">
                        {report.description?.length > 100
                          ? report.description.substring(0, 100) + '...'
                          : report.description}
                      </p>
                      <div className="search-result-meta">
                        <span>By {report.full_name || 'Unknown'}</span>
                        <span><MdAccessTime size={12} /> {timeAgo(report.created_at)}</span>
                        <span className="search-result-status">{report.status}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Forum Posts */}
        {filteredPosts.length > 0 && (
          <div className="search-section">
            {activeTab === 'all' && <h2><MdForum size={18} /> Forum Posts</h2>}
            <div className="search-results">
              {filteredPosts.map(post => (
                <Link to={`/forum/${post.id}`} key={post.id} className="search-result-card">
                  <div className="search-result-left">
                    <div className="search-result-icon forum-icon">
                      <MdForum size={18} color="#2563eb" />
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">
                        <span className="search-result-type" style={{ background: getCategoryColor(post.category) }}>
                          {post.category}
                        </span>
                        <strong>{post.title}</strong>
                      </div>
                      <p className="search-result-desc">
                        {post.content?.length > 100
                          ? post.content.substring(0, 100) + '...'
                          : post.content}
                      </p>
                      <div className="search-result-meta">
                        <span>By {post.full_name || 'Anonymous'}</span>
                        <span><MdAccessTime size={12} /> {timeAgo(post.created_at)}</span>
                        <span><MdChat size={12} /> {post.reply_count} replies</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state — no results */}
        {searched && !loading && totalResults === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No results found</h3>
            <p>We couldn't find anything for "<strong>{searchParams.get('q')}</strong>". Try different keywords or check your spelling.</p>
            <div className="search-suggestions">
              <p>Try searching for:</p>
              <div className="search-suggestion-tags">
                {['Bike Lane', 'Safety', 'Parking', 'Birmingham', 'Crossing'].map(tag => (
                  <button
                    key={tag}
                    className="search-suggestion-tag"
                    onClick={() => { setQuery(tag); setSearchParams({ q: tag }); }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Initial state */}
        {!searched && (
          <div className="empty-state">
            <div className="empty-state-icon">🚴</div>
            <h3>Search GreenGaps</h3>
            <p>Find reports and forum discussions across Birmingham's cycling infrastructure.</p>
            <div className="search-suggestions">
              <p>Popular searches:</p>
              <div className="search-suggestion-tags">
                {['Bike Lane', 'Safety', 'Parking', 'Birmingham', 'Crossing'].map(tag => (
                  <button
                    key={tag}
                    className="search-suggestion-tag"
                    onClick={() => { setQuery(tag); setSearchParams({ q: tag }); }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;