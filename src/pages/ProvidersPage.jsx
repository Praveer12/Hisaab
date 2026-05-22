import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ProviderForm from '../components/Provider/ProviderForm';
import ProviderList from '../components/Provider/ProviderList';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import { useApp } from '../context/AppContext';

export default function ProvidersPage() {
  const { providers, addProvider, updateProvider, deleteProvider, showToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  
  const handleAdd = (data) => {
    addProvider(data);
    setShowForm(false);
    showToast('Provider added successfully!', 'success');
  };
  
  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };
  
  const handleUpdate = (data) => {
    updateProvider(editingProvider.id, data);
    setEditingProvider(null);
    setShowForm(false);
    showToast('Provider updated successfully!', 'success');
  };
  
  const handleDelete = (id) => {
    deleteProvider(id);
    showToast('Provider deleted', 'success');
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingProvider(null);
  };
  
  return (
    <div className="providers-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Providers</h2>
          <p className="page-subtitle">Manage your milk providers</p>
        </div>
        <Button 
          variant="primary" 
          icon={Plus} 
          onClick={() => { setEditingProvider(null); setShowForm(true); }}
        >
          Add Provider
        </Button>
      </div>
      
      <ProviderList
        providers={providers}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      
      <Modal
        isOpen={showForm}
        onClose={handleCancel}
        title={editingProvider ? 'Edit Provider' : 'Add New Provider'}
        size="md"
      >
        <ProviderForm
          provider={editingProvider}
          onSubmit={editingProvider ? handleUpdate : handleAdd}
          onCancel={handleCancel}
        />
      </Modal>
    </div>
  );
}
