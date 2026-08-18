import React, { useState } from 'react';
import { Edit, Trash2, Phone, MapPin, IndianRupee, User, Truck } from 'lucide-react';
import Button from '../UI/Button';
import Card from '../UI/Card';
import Modal from '../UI/Modal';

export default function ProviderList({ providers, onEdit, onDelete, currentProviderId, onSetCurrent }) {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  if (providers.length === 0) {
    return (
      <div className="empty-state">
        <User size={48} />
        <h3>No Providers Yet</h3>
        <p>Add your first milk provider to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="provider-grid">
        {providers.map(provider => {
          const isCurrent = provider.id === currentProviderId;
          return (
            <Card key={provider.id} className={`provider-card ${provider.isActive ? 'active' : ''} ${isCurrent ? 'provider-current' : ''}`}>
              <div className="provider-card-header">
                <h3 className="provider-name">{provider.name}</h3>
                <span className={`provider-badge ${isCurrent ? 'badge-delivering' : (provider.isActive ? 'badge-active' : 'badge-inactive')}`}>
                  {isCurrent ? '🚚 Delivering' : (provider.isActive ? 'Active' : 'Inactive')}
                </span>
              </div>
              <div className="provider-details">
                {provider.contact && (
                  <div className="provider-detail-item">
                    <Phone size={16} />
                    <span>{provider.contact}</span>
                  </div>
                )}
                <div className="provider-detail-item">
                  <IndianRupee size={16} />
                  <span>₹{provider.ratePerLitre} / litre</span>
                </div>
                {provider.defaultQuantity > 0 && (
                  <div className="provider-detail-item">
                    <Truck size={16} />
                    <span>Default: {provider.defaultQuantity}L / day</span>
                  </div>
                )}
                {provider.address && (
                  <div className="provider-detail-item">
                    <MapPin size={16} />
                    <span>{provider.address}</span>
                  </div>
                )}
              </div>

              {/* Currently Delivering Toggle */}
              <button
                className={`provider-delivering-btn ${isCurrent ? 'delivering-active' : ''}`}
                onClick={() => onSetCurrent(isCurrent ? '' : provider.id)}
              >
                <span className={`delivering-dot ${isCurrent ? 'dot-active' : ''}`}></span>
                <span>{isCurrent ? 'Currently Delivering ✅' : 'Set as Delivering'}</span>
              </button>

              <div className="provider-actions">
                <Button variant="secondary" size="sm" icon={Edit} onClick={() => onEdit(provider)}>Edit</Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => setDeleteConfirm(provider)}>Delete</Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Provider"
        size="sm"
        footer={
          <div className="flex-between">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="danger" icon={Trash2} onClick={() => { onDelete(deleteConfirm.id); setDeleteConfirm(null); }}>Delete</Button>
          </div>
        }
      >
        <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? All entries associated with this provider will also be deleted.</p>
      </Modal>
    </>
  );
}
