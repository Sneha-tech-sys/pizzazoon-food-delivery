import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();
      const res = await apiClient.get('/admin/contacts', { params });
      if (res.data && res.data.data) {
        setContacts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleStatusChange = async (contactId, status) => {
    try {
      await apiClient.put(`/admin/contacts/${contactId}/status`, { status });
      fetchContacts();
    } catch (err) {
      alert('Failed to update inquiry status');
    }
  };

  const handleAddNote = async (contactId) => {
    if (!newNote.trim()) return;
    setProcessing(true);
    try {
      await apiClient.post(`/admin/contacts/${contactId}/notes`, { note: newNote.trim() });
      setNewNote('');
      fetchContacts();
      // update selected modal state
      const updated = contacts.find((c) => c.id === contactId);
      if (updated) setSelectedContact(updated);
    } catch (err) {
      alert('Failed to add internal note');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendReply = async (contactId) => {
    if (!replyMessage.trim()) return;
    setProcessing(true);
    try {
      await apiClient.post(`/admin/contacts/${contactId}/reply`, { message: replyMessage.trim() });
      setReplyMessage('');
      alert('Email reply successfully sent to customer!');
      setSelectedContact(null);
      fetchContacts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to dispatch email reply');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'orange', margin: 0 }}>Contact Inquiries</h2>
          <small style={{ color: 'gray' }}>OTP-verified inquiries submitted by customers</small>
        </div>
      </div>

      <div className="row g-2 mb-4">
        <div className="col-md-7">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchContacts();
            }}
            className="d-flex gap-2"
          >
            <input
              type="text"
              className="form-control"
              placeholder="Search by customer, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
            />
            <button type="submit" className="btn btn-warning" style={{ width: 'auto' }}>
              Search
            </button>
          </form>
        </div>
        <div className="col-md-5 d-flex gap-2 align-items-center justify-content-md-end">
          <span style={{ fontSize: '13px', color: 'gray' }}>Status:</span>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff', width: 'auto' }}
          >
            <option value="All">All Inquiries</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p className="text-center py-5 text-warning">Loading inquiries...</p>
        ) : contacts.length === 0 ? (
          <p className="text-center py-5 text-secondary">No inquiries found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 bg-transparent">
              <thead>
                <tr style={{ color: 'orange', fontSize: '13px' }}>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Message Preview</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id} style={{ fontSize: '13px', verticalAlign: 'middle' }}>
                    <td>
                      <div style={{ fontWeight: 'bold' }}>{c.full_name}</div>
                      <small className="text-secondary">{c.email} | {c.phone}</small>
                    </td>
                    <td style={{ color: 'orange' }}>{c.subject}</td>
                    <td style={{ maxWidth: '280px' }}>
                      <div className="text-truncate">{c.message}</div>
                    </td>
                    <td>
                      <span className="badge bg-success">Email OTP Verified</span>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={c.status}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        style={{
                          backgroundColor:
                            c.status === 'Resolved' ? '#1b5e20' : c.status === 'In Progress' ? '#e65100' : '#0d47a1',
                          color: '#fff',
                          border: 'none',
                          width: 'auto',
                        }}
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </td>
                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => setSelectedContact(c)}
                        style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
                      >
                        View & Reply
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail & Reply Modal */}
      {selectedContact && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
          }}
        >
          <div
            style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #333',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '650px',
              padding: '24px',
              color: '#fff',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 style={{ color: 'orange', margin: 0 }}>Inquiry Details</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setSelectedContact(null)}
                style={{ width: 'auto' }}
              >
                ✕
              </button>
            </div>

            <div className="p-3 mb-3 rounded" style={{ backgroundColor: '#252525' }}>
              <div className="d-flex justify-content-between mb-2">
                <strong>{selectedContact.full_name}</strong>
                <span className="text-secondary small">{selectedContact.email} | {selectedContact.phone}</span>
              </div>
              <h6 style={{ color: 'orange' }}>{selectedContact.subject}</h6>
              <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: '#eee' }}>{selectedContact.message}</p>
            </div>

            {/* Internal Notes */}
            <h6 style={{ color: 'gray', fontSize: '13px' }}>Internal Team Notes</h6>
            <div className="mb-3 p-2 rounded" style={{ backgroundColor: '#181818', maxHeight: '140px', overflowY: 'auto' }}>
              {selectedContact.notes && selectedContact.notes.length > 0 ? (
                selectedContact.notes.map((n) => (
                  <div key={n.id} className="small mb-1 pb-1" style={{ borderBottom: '1px solid #282828' }}>
                    <span style={{ color: 'orange' }}>{n.admin_name}</span>{' '}
                    <span className="text-secondary">({new Date(n.created_at).toLocaleTimeString()}):</span> {n.note}
                  </div>
                ))
              ) : (
                <div className="small text-secondary">No internal notes added yet.</div>
              )}
            </div>

            <div className="d-flex gap-2 mb-4">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Add private staff note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ backgroundColor: '#252525', border: '1px solid #444', color: '#fff' }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddNote(selectedContact.id)}
                disabled={processing}
                style={{ width: 'auto' }}
              >
                Add Note
              </button>
            </div>

            {/* Email Reply */}
            <h6 style={{ color: 'orange', fontSize: '13px' }}>Send Official Email Reply</h6>
            <textarea
              className="form-control mb-2"
              rows="3"
              placeholder="Type your response to the customer. This will be emailed directly to them..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              style={{ backgroundColor: '#252525', border: '1px solid #444', color: '#fff' }}
            />
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-warning btn-sm"
                onClick={() => handleSendReply(selectedContact.id)}
                disabled={processing || !replyMessage.trim()}
                style={{ width: 'auto' }}
              >
                {processing ? 'Sending Email...' : 'Send Email Reply & Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
