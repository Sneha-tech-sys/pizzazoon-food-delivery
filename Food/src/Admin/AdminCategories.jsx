import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', is_active: true });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/categories/');
      if (res.data && res.data.data) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '', is_active: true });
    setModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCategory(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      is_active: c.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await apiClient.put(`/admin/categories/${editingCategory.id}`, form);
      } else {
        await apiClient.post('/admin/categories', form);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save category');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'orange', margin: 0 }}>Category Management</h2>
          <small style={{ color: 'gray' }}>Organize food catalog by cuisine and meal types</small>
        </div>
        <button className="btn btn-warning btn-sm" onClick={openAddModal} style={{ width: 'auto' }}>
          <i className="fa fa-plus" /> Add Category
        </button>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p className="text-center py-5 text-warning">Loading categories...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 bg-transparent">
              <thead>
                <tr style={{ color: 'orange', fontSize: '13px' }}>
                  <th>ID</th>
                  <th>Category Name</th>
                  <th>Slug</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ fontSize: '13px', verticalAlign: 'middle' }}>
                    <td>{c.id}</td>
                    <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                    <td><code>{c.slug}</code></td>
                    <td>{c.description || '-'}</td>
                    <td>
                      <span className={`badge ${c.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => openEditModal(c)}
                        style={{ width: 'auto', padding: '2px 8px', fontSize: '12px' }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
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
              maxWidth: '450px',
              padding: '24px',
              color: '#fff',
            }}
          >
            <h5 style={{ color: 'orange', marginBottom: '16px' }}>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label style={{ fontSize: '13px', color: 'gray' }}>Category Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              <div className="mb-3">
                <label style={{ fontSize: '13px', color: 'gray' }}>URL Slug</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              <div className="mb-3">
                <label style={{ fontSize: '13px', color: 'gray' }}>Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setModalOpen(false)}
                  style={{ width: 'auto' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning btn-sm" style={{ width: 'auto' }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
