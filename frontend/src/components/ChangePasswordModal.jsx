import { useState } from 'react';
import api from '../api';
import Modal from './Modal';

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword('');
      setTimeout(() => { onClose(); setSuccess(''); }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-2 rounded text-sm">{success}</div>}
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border rounded" />
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium">
          Update Password
        </button>
      </form>
    </Modal>
  );
}