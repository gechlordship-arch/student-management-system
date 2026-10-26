import { useState } from 'react';
import api from '../api';
import Modal from './Modal';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
      setStep(2); // Move to step 2
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send code');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await api.post('/auth/reset-password', { email, token, newPassword });
      setSuccess(res.data.message);
      setTimeout(() => {
        onClose();
        setStep(1); setEmail(''); setToken(''); setNewPassword(''); setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forgot Password">
      {error && <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded text-sm mb-4">{success}</div>}

      {step === 1 ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <p className="text-sm text-gray-600">Enter your email and we will print a reset code to the backend terminal.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-medium">Send Reset Code</button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-sm text-gray-600">Check your backend terminal for the 6-digit code.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reset Code</label>
            <input type="text" required placeholder="e.g. A1B2C3" value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full p-2 border rounded uppercase" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full p-2 border rounded" />
          </div>
          <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition font-medium">Reset Password</button>
        </form>
      )}
    </Modal>
  );
}