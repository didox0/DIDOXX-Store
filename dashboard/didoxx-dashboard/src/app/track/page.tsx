import { Package, Wallet, Truck, Clock } from 'lucide-react';
import StatCard from '@/components/StatCard';
import OrderCard from '@/components/OrderCard';
import { orders } from '@/data/orders';

export const metadata = {
  title: 'Track Orders – DIDOX-KITCHEN',
};

export default function TrackOrdersPage() {
  // Calculate simple KPIs from mock data
  const totalOrders = orders.length;
  const totalSpend = orders.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2);
  const activeDeliveries = orders.filter((o) => o.status < 3).length;
  const avgDeliveryTime = '25 mins'; // placeholder

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="text-center text-foreground">
        <h1 className="text-3xl font-bold mb-1">Track Active Deliveries</h1>
        <p className="text-sm opacity-80">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package className="w-6 h-6" />} title="Total Orders" value={totalOrders} />
        <StatCard icon={<Wallet className="w-6 h-6" />} title="Total Spend" value={`$${totalSpend}`} />
        <StatCard icon={<Truck className="w-6 h-6" />} title="Active Deliveries" value={activeDeliveries} />
        <StatCard icon={<Clock className="w-6 h-6" />} title="Avg Delivery Time" value={avgDeliveryTime} />
      </div>

      {/* Orders list */}
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </section>
  );
}
