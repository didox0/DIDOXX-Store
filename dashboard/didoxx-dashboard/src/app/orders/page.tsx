import { useState } from 'react';
import { Package, Wallet, Truck, Clock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import OrderCard from '@/components/OrderCard';
import { orders } from '@/data/orders';

export const metadata = {
  title: 'Orders – DIDOX-KITCHEN',
};

export default function OrdersPage() {
  const [view, setView] = useState<'in-process' | 'delivered'>('in-process');
  const totalOrders = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2);
  const activeDeliveries = orders.filter((o) => o.status < 3).length;
  const deliveredOrders = orders.filter((o) => o.status === 3).length;
  const avgDeliveryTime = '25 mins'; // placeholder
  const filteredOrders = orders.filter((order) =>
    view === 'delivered' ? order.status === 3 : order.status < 3
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="text-center text-foreground py-1">
        <h1 className="text-sm font-bold">
          {view === 'delivered' ? 'Delivered Orders' : 'In Process Orders'}
        </h1>
        <p className="text-xs opacity-80">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </header>

      {/* Filter buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setView('in-process')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            view === 'in-process'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          In Process
        </button>
        <button
          type="button"
          onClick={() => setView('delivered')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            view === 'delivered'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Delivered
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
        <StatCard icon={<Package className="w-6 h-6" />} title="Total Orders" value={totalOrders} />
        <StatCard icon={<Wallet className="w-6 h-6" />} title="Total Spend" value={`$${totalSpend}`} />
        <StatCard icon={<Truck className="w-6 h-6" />} title="Active Deliveries" value={activeDeliveries} />
        <StatCard icon={<Clock className="w-6 h-6" />} title="Delivered" value={deliveredOrders} />
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
