import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Mail, MapPin, Building, GraduationCap, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function UserProfileModal({ user: profileUser, onClose }) {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const basePath = currentUser?.role === 'recruiter' ? '/recruiter' : '/student';

  const handleChat = () => {
    // Navigate to chat and pass the target user object
    // Based on how chat is setup, it expects state: { recruiter: obj } or { student: obj }
    const stateObj = profileUser.role === 'recruiter' 
      ? { recruiter: profileUser } 
      : { student: profileUser };
      
    navigate(`${basePath}/chat`, { state: stateObj });
  };

  if (!profileUser) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="neo-card bg-white w-full max-w-xl overflow-y-auto max-h-[95vh]"
        >
          {/* Header */}
          <div className="bg-brand-dark p-6 text-white relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-white/10 transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-brand-primary border-4 border-white flex items-center justify-center text-white font-black text-3xl shrink-0 shadow-brutal">
                {profileUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-wide">{profileUser.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-xs font-black uppercase px-2 py-0.5 border-2 border-white/20 ${profileUser.role === 'recruiter' ? 'bg-brand-accent text-brand-dark' : 'bg-brand-bg text-brand-dark'}`}>
                    {profileUser.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="text-brand-primary shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-brand-muted uppercase">Email Address</p>
                  <p className="font-semibold text-brand-dark break-all">{profileUser.email}</p>
                </div>
              </div>
              
              {profileUser.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="text-brand-secondary shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase">Location</p>
                    <p className="font-semibold text-brand-dark">{profileUser.location}</p>
                  </div>
                </div>
              )}

              {(profileUser.companyName || profileUser.role === 'recruiter') && (
                <div className="flex items-start gap-3">
                  <Building className="text-brand-accent shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase">Company</p>
                    <p className="font-semibold text-brand-dark">{profileUser.companyName || 'Not specified'}</p>
                  </div>
                </div>
              )}

              {(profileUser.college || profileUser.role === 'student') && (
                <div className="flex items-start gap-3">
                  <GraduationCap className="text-brand-primary shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs font-bold text-brand-muted uppercase">College / University</p>
                    <p className="font-semibold text-brand-dark">{profileUser.college || 'Not specified'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t-2 border-brand-dark/10 pt-4">
              <div className="flex items-start gap-3">
                <Info className="text-brand-muted shrink-0 mt-1" size={18} />
                <div className="flex-1">
                  <p className="text-xs font-bold text-brand-muted uppercase mb-1">Bio / About</p>
                  <p className="text-sm text-brand-dark/80 whitespace-pre-wrap leading-relaxed">
                    {profileUser.bio || 'No bio provided by the user.'}
                  </p>
                </div>
              </div>
            </div>

            {profileUser.skills?.length > 0 && (
              <div className="border-t-2 border-brand-dark/10 pt-4">
                <p className="text-xs font-bold text-brand-muted uppercase mb-2">Skills & Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill, index) => (
                    <span key={index} className="neo-badge bg-gray-100 text-sm py-1 px-3">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {profileUser._id !== currentUser.id && profileUser._id !== currentUser._id && (
            <div className="p-4 bg-gray-50 border-t-3 border-brand-dark flex gap-3">
              <button onClick={handleChat} className="neo-btn-primary flex-1 py-3 flex justify-center items-center gap-2">
                <MessageCircle size={20} /> Message {profileUser.name.split(' ')[0]}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
