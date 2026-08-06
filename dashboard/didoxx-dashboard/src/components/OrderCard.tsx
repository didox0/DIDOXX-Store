'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, Circle } from 'lucide-react';
import { format } from 'date-fns';


interface Order {
  id: string;
  product: string;
  restaurant: string;
  orderedAt: string; // ISO string
  location: string;
  quantity: number;
  totalPrice: number;
  status: number; // 0-3
}

const steps = ['Order Placed', 'Preparing Food', 'Out For Delivery', 'Delivered'];

export default function OrderCard({ order }: { order: Order }) {
  const formattedDate = format(new Date(order.orderedAt), 'PPP p');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-lg p-2 shadow-glass"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-xs font-semibold text-foreground">{order.id}</h3>
        <span className="text-xs text-foreground opacity-70">{formattedDate}</span>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-1 text-xs text-foreground opacity-90 mb-2">
        <div>
          <p><span className="font-medium">Product:</span> {order.product}</p>
          <p><span className="font-medium">Customer:</span> {order.restaurant}</p>
        </div>
        <div>
          <p><span className="font-medium">Total:</span> ${order.totalPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mb-2 pl-4">
        <div className="absolute left-1 top-0 h-full w-px bg-white/20" />
        {steps.map((step, idx) => {
          const isCompleted = idx < order.status;
          const isActive = idx === order.status;
          return (
            <div key={step} className="flex items-center mb-1 last:mb-0">
              <div className="relative z-10">
                {isCompleted ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : isActive ? (
                  <Circle className="w-3 h-3 text-primary-500 animate-pulse" />
                ) : (
                  <Circle className="w-3 h-3 text-white/30" />
                )}
              </div>
              <span className="ml-1 text-xs text-foreground opacity-80">{step}</span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-1 gap-1">
        <button className="px-2 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs transition">
          Dispatch
        </button>
        <button className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition">
          Cancel
        </button>
      </div>
    </motion.div>
  );
}
