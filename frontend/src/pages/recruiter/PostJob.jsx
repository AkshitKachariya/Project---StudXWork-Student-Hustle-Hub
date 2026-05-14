import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../components/CustomDatePicker';

export default function PostJob() {
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm();
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) { setSkills([...skills, skillInput.trim()]); setSkillInput(''); }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await api.post('/jobs', { ...data, skills });
      toast.success('Job posted successfully!');
      reset(); setSkills([]);
      navigate('/recruiter/listings');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post job'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-secondary text-white mb-2">Create</div>
        <h1 className="page-title">Post a Job</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block font-bold mb-1">Job Title <span className="text-brand-primary">*</span></label>
            <input {...register('title', { required: 'Title required' })} className="neo-input" placeholder="e.g. Frontend Developer Intern" />
            {errors.title && <p className="text-brand-primary text-sm mt-1">⚠ {errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-bold mb-1">Job Description <span className="text-brand-primary">*</span></label>
            <textarea {...register('description', { required: 'Description required' })} rows={5} className="neo-input resize-none"
              placeholder="Role responsibilities, requirements, company culture..." />
            {errors.description && <p className="text-brand-primary text-sm mt-1">⚠ {errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Job Type <span className="text-brand-primary">*</span></label>
              <select {...register('type', { required: true })} className="neo-input">
                <option value="internship">Internship</option>
                <option value="part-time">Part-Time</option>
                <option value="full-time">Full-Time</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
            <div>
              <label className="block font-bold mb-1">Location</label>
              <input {...register('location')} className="neo-input" placeholder="Remote / City" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Salary / Stipend</label>
              <input {...register('salary')} className="neo-input" placeholder="₹15,000/mo or Negotiable" />
            </div>
            
            <Controller
              name="lastDate"
              control={control}
              render={({ field }) => (
                <CustomDatePicker 
                  label="Last Date to Apply"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Required Skills</label>
            <div className="flex gap-2 mb-3">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="neo-input flex-1" placeholder="e.g. React, Node.js..." />
              <button type="button" onClick={addSkill} className="neo-btn-accent px-4"><Plus size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="neo-badge bg-brand-secondary text-white flex items-center gap-2">
                  {s} <button type="button" onClick={() => setSkills(skills.filter(sk => sk !== s))}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="neo-btn-secondary w-full py-3 text-base">
            {loading ? '⏳ Posting...' : '🚀 Post Job'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
