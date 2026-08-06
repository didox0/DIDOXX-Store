'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';


interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
}

export default function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-2xl p-4 flex items-center space-x-3 shadow-glass"
    >
      <div className="text-primary-500 p-2 rounded-md bg-white/10">{icon}</div>
      <div className="flex flex-col">
        <span className="text-sm text-foreground opacity-80">{title}</span>
        <span className="text-xl font-bold text-foreground">{value}</span>
      </div>
    </motion.div>
  );
}
