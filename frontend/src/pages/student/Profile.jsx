import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile/me');
      setProfile(res.data.data);
      setSkills(res.data.data.skills || []);
      reset(res.data.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
    } finally { setLoading(false); }
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const res = await api.put('/profile/update', { ...data, skills });
      const updatedUser = res.data.data;
      setProfile(updatedUser);
      updateUser({ name: updatedUser.name });
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.error || 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="neo-card p-12 text-center animate-pulse">Loading profile...</div>;

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-accent mb-2">My Profile</div>
        <h1 className="page-title">Edit Profile</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-8 max-w-2xl">
        {/* Avatar Placeholder */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b-3 border-brand-dark">
          <div className="w-20 h-20 bg-brand-primary border-3 border-brand-dark flex items-center justify-center text-white text-3xl font-black">
            {(profile?.name || user?.name || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.name || user?.name}</h2>
            <p className="text-brand-muted">{profile?.email || user?.email}</p>
            <span className="neo-badge bg-brand-accent mt-1 uppercase text-[10px]">Student</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Full Name</label>
              <input {...register('name')} className="neo-input" />
            </div>
            <div>
              <label className="block font-bold mb-1">Phone Number</label>
              <input {...register('phone')} className="neo-input" placeholder="+91 9999999999" />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">College / University</label>
            <input {...register('college')} className="neo-input" placeholder="e.g. IIT Bombay" />
          </div>

          <div>
            <label className="block font-bold mb-1">Bio</label>
            <textarea {...register('bio')} rows={3} className="neo-input resize-none" placeholder="Tell recruiters about yourself..." />
          </div>

          {/* Skills */}
          <div>
            <label className="block font-bold mb-2">Skills</label>
            <div className="flex gap-2 mb-3">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="neo-input flex-1" placeholder="Type a skill and press Enter" />
              <button type="button" onClick={addSkill} className="neo-btn-accent px-4"><Plus size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="neo-badge bg-brand-secondary text-white flex items-center gap-2">
                  {s}
                  <button type="button" onClick={() => setSkills(skills.filter(sk => sk !== s))}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="neo-btn-primary px-8 py-3">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
