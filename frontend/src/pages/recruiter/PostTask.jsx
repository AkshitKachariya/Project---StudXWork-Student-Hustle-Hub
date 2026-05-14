import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import CustomDatePicker from '../../components/CustomDatePicker';

export default function PostTask() {
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
      await api.post('/tasks', { ...data, skills });
      toast.success('Task posted successfully!');
      reset(); setSkills([]);
      navigate('/recruiter/listings');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post task'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="neo-badge bg-brand-accent mb-2">Create</div>
        <h1 className="page-title">Post a Mini Task</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neo-card p-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block font-bold mb-1">Task Title <span className="text-brand-primary">*</span></label>
            <input {...register('title', { required: 'Title is required' })} className="neo-input" placeholder="e.g. Design a landing page in Figma" />
            {errors.title && <p className="text-brand-primary text-sm mt-1">⚠ {errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-bold mb-1">Description <span className="text-brand-primary">*</span></label>
            <textarea {...register('description', { required: 'Description is required' })} rows={5} className="neo-input resize-none"
              placeholder="Detailed instructions for the task, deliverables, format required..." />
            {errors.description && <p className="text-brand-primary text-sm mt-1">⚠ {errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Budget (₹) <span className="text-brand-primary">*</span></label>
              <input type="number" {...register('budget', { required: 'Budget required', min: 1 })} className="neo-input" placeholder="500" />
              {errors.budget && <p className="text-brand-primary text-sm mt-1">⚠ {errors.budget.message}</p>}
            </div>
            
            <Controller
              name="deadline"
              control={control}
              rules={{ required: 'Deadline required' }}
              render={({ field }) => (
                <CustomDatePicker 
                  label={<>Deadline <span className="text-brand-primary">*</span></>}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.deadline?.message}
                />
              )}
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Required Skills</label>
            <div className="flex gap-2 mb-3">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="neo-input flex-1" placeholder="e.g. Figma, React, Python..." />
              <button type="button" onClick={addSkill} className="neo-btn-accent px-4"><Plus size={18} /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="neo-badge bg-brand-dark text-white flex items-center gap-2">
                  {s} <button type="button" onClick={() => setSkills(skills.filter(sk => sk !== s))}><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="neo-btn-accent w-full py-3 text-base">
            {loading ? '⏳ Posting...' : '🚀 Post Task'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
