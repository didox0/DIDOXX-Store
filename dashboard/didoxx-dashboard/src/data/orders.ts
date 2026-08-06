export const orders = [
  {
    id: 'ORD-00123',
    product: 'Margherita Pizza',
    restaurant: 'Casa Italiano',
    orderedAt: '2026-05-30T09:15:00Z',
    location: '123 Main St, Cityville',
    quantity: 2,
    totalPrice: 24.99,
    status: 1, // 0 = Placed, 1 = Preparing, 2 = Out for delivery, 3 = Delivered
  },
  {
    id: 'ORD-00456',
    product: 'Sushi Platter',
    restaurant: 'Sakura',
    orderedAt: '2026-05-30T09:45:00Z',
    location: '456 Oak Ave, Townsville',
    quantity: 1,
    totalPrice: 35.5,
    status: 2,
  },
];
