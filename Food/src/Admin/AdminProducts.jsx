import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    description: '',
    price: '',
    rating: '4.5',
    stock: '100',
    image_url: 'Assets/food.avif',
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get('/products/?page_size=100'),
        apiClient.get('/categories/'),
      ]);
      if (prodRes.data && prodRes.data.data) {
        setProducts(prodRes.data.data.items || []);
      }
      if (catRes.data && catRes.data.data) {
        setCategories(catRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching products/categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      description: '',
      price: '',
      rating: '4.5',
      stock: '100',
      image_url: 'Assets/food.avif',
      is_active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setForm({
      name: prod.name,
      category_id: prod.category_id,
      description: prod.description || '',
      price: prod.price,
      rating: prod.rating,
      stock: prod.stock,
      image_url: prod.image_url,
      is_active: prod.is_active,
    });
    setModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/admin/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.data?.image_url) {
        setForm((prev) => ({ ...prev, image_url: res.data.data.image_url }));
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        category_id: parseInt(form.category_id),
        description: form.description,
        price: parseFloat(form.price),
        rating: parseFloat(form.rating),
        stock: parseInt(form.stock),
        image_url: form.image_url,
        is_active: form.is_active,
      };

      if (editingProduct) {
        await apiClient.put(`/admin/products/${editingProduct.id}`, payload);
      } else {
        await apiClient.post('/admin/products', payload);
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save product');
    }
  };

  const toggleProductActive = async (prod) => {
    try {
      await apiClient.put(`/admin/products/${prod.id}`, { is_active: !prod.is_active });
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 style={{ color: 'orange', margin: 0 }}>Product Catalog</h2>
          <small style={{ color: 'gray' }}>Manage dishes, prices, inventory, and categories</small>
        </div>
        <button className="btn btn-warning btn-sm" onClick={openAddModal} style={{ width: 'auto' }}>
          <i className="fa fa-plus" /> Add New Product
        </button>
      </div>

      <div style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p className="text-center py-5 text-warning">Loading products...</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 bg-transparent">
              <thead>
                <tr style={{ color: 'orange', fontSize: '13px' }}>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Rating</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ fontSize: '13px', verticalAlign: 'middle' }}>
                    <td>
                      <img
                        src={`${process.env.PUBLIC_URL}/${p.image_url}`}
                        alt={p.name}
                        style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                    </td>
                    <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                    <td>
                      <span className="badge bg-secondary">{p.category_name}</span>
                    </td>
                    <td>₹{parseFloat(p.price).toFixed(2)}</td>
                    <td>★ {p.rating}</td>
                    <td>{p.stock}</td>
                    <td>
                      <span className={`badge ${p.is_active ? 'bg-success' : 'bg-danger'}`}>
                        {p.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => openEditModal(p)}
                          style={{ width: 'auto', padding: '2px 8px', fontSize: '12px' }}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${p.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => toggleProductActive(p)}
                          style={{ width: 'auto', padding: '2px 8px', fontSize: '12px' }}
                        >
                          {p.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
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
              maxWidth: '550px',
              padding: '24px',
              color: '#fff',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h5 style={{ color: 'orange', marginBottom: '16px' }}>
              {editingProduct ? 'Edit Product' : 'Add New Dish'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label style={{ fontSize: '13px', color: 'gray' }}>Dish Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', color: 'gray' }}>Category</label>
                  <select
                    className="form-select"
                    required
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', color: 'gray' }}>Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', color: 'gray' }}>Rating (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    className="form-control"
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  />
                </div>
                <div className="col-md-6">
                  <label style={{ fontSize: '13px', color: 'gray' }}>Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label style={{ fontSize: '13px', color: 'gray' }}>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                />
              </div>

              <div className="mb-3">
                <label style={{ fontSize: '13px', color: 'gray' }}>Product Image</label>
                <div className="d-flex gap-2 align-items-center mb-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleImageUpload}
                    style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff' }}
                  />
                  {uploadingImage && <small className="text-warning">Uploading...</small>}
                </div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Or enter path e.g. Assets/dosa.jpeg"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  style={{ backgroundColor: '#2a2a2a', border: '1px solid #444', color: '#fff', fontSize: '12px' }}
                />
              </div>

              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="activeCheck"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="activeCheck" style={{ fontSize: '13px' }}>
                  Enable product for customers immediately
                </label>
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
