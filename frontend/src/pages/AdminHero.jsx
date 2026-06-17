import React, { useEffect, useState } from 'react';
import { MonitorPlay, Save, Smartphone, Trash2, UploadCloud } from 'lucide-react';
import AdminGuard from '../components/AdminGuard.jsx';
import AdminNav from '../components/AdminNav.jsx';
import { api } from '../api/client.js';

const emptyHero = { desktop_video_url: '', mobile_video_url: '' };

export default function AdminHero({ navigate }) {
  const [hero, setHero] = useState(emptyHero);
  const [uploading, setUploading] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api('/hero').then((data) => setHero(data.hero)).catch((err) => setError(err.message));
  }, []);

  async function uploadVideo(event, device) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setMessage('');
    setUploading(device);
    try {
      const body = new FormData();
      body.append('video', file);
      const data = await api('/hero/admin/upload', { method: 'POST', body });
      setHero((current) => ({ ...current, [`${device}_video_url`]: data.video_url }));
      setMessage(`${device === 'desktop' ? 'Desktop' : 'Mobile'} video uploaded. Save changes to publish it.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading('');
      event.target.value = '';
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const data = await api('/hero/admin', { method: 'PUT', body: JSON.stringify(hero) });
      setHero(data.hero);
      setMessage('Hero videos published successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function mediaCard(device, title, description, Icon) {
    const field = `${device}_video_url`;
    const videoUrl = hero[field];
    return (
      <article className="hero-media-card">
        <div className="hero-media-card-head">
          <span className="device-icon"><Icon /></span>
          <div><h2>{title}</h2><p>{description}</p></div>
        </div>
        <div className="hero-video-preview">
          {videoUrl ? <video key={videoUrl} src={videoUrl} muted loop autoPlay playsInline /> : <div className="video-empty"><UploadCloud /><strong>No video selected</strong><span>The storefront image remains active.</span></div>}
        </div>
        <div className="hero-media-actions">
          <label className="btn primary">
            <input type="file" accept="video/mp4,video/webm" onChange={(event) => uploadVideo(event, device)} disabled={!!uploading} />
            <UploadCloud size={17} /> {uploading === device ? 'Uploading...' : videoUrl ? 'Replace video' : 'Upload video'}
          </label>
          {videoUrl && <button type="button" className="btn ghost danger-text" onClick={() => setHero((current) => ({ ...current, [field]: '' }))}><Trash2 size={16} /> Remove</button>}
        </div>
        <small className="media-hint">MP4 or WebM, maximum 80 MB. Short compressed loops provide the best performance.</small>
      </article>
    );
  }

  return (
    <AdminGuard navigate={navigate}>
      <section className="container dashboard-page">
        <AdminNav navigate={navigate} />
        <div className="admin-heading">
          <div><span className="eyebrow">Storefront media</span><h1>Hero videos</h1><p>Publish device-specific motion backgrounds for the home hero.</p></div>
          <button className="btn lime" onClick={save} disabled={saving || !!uploading}><Save size={17} /> {saving ? 'Saving...' : 'Publish changes'}</button>
        </div>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}
        <div className="hero-media-grid">
          {mediaCard('desktop', 'Desktop video', 'Landscape video for tablets and larger screens.', MonitorPlay)}
          {mediaCard('mobile', 'Mobile video', 'Portrait video optimized for narrow mobile screens.', Smartphone)}
        </div>
      </section>
    </AdminGuard>
  );
}
