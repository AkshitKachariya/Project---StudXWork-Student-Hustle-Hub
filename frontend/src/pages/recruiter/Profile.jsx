import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RecruiterProfile() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data.data);
      reset(res.data.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await api.put('/profile/update', data);
      const updatedUser = res.data.data;
      setProfile(updatedUser);
      updateUser({ name: updatedUser.name });
      toast.success('Company profile updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="neo-card p-12 text-center animate-pulse">Loading profile...</div>;

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-secondary text-white mb-2">Company Profile</div>
        <h1 className="page-title">Edit Profile</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-8 max-w-2xl">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b-3 border-brand-dark">
          <div className="w-20 h-20 bg-brand-secondary border-3 border-brand-dark flex items-center justify-center text-white text-3xl font-black">
            {(profile?.name || profile?.companyName || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.name || profile?.companyName || user?.name}</h2>
            <p className="text-brand-muted">{profile?.email || user?.email}</p>
            <span className="neo-badge bg-brand-secondary text-white mt-1 uppercase text-[10px]">Recruiter</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Your Name</label>
              <input {...register('name')} className="neo-input" />
            </div>
            <div>
              <label className="block font-bold mb-1">Company Name</label>
              <input {...register('companyName')} className="neo-input" />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Phone Number</label>
            <input {...register('phone')} className="neo-input" placeholder="+91 9999999999" />
          </div>

          <div>
            <label className="block font-bold mb-1">About Company</label>
            <textarea {...register('bio')} rows={4} className="neo-input resize-none" placeholder="What does your company do?..." />
          </div>

          <button type="submit" disabled={saving} className="neo-btn-secondary px-8 py-3">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
