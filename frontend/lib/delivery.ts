// Orders are promised for delivery within 10 days of the order date.
export const DELIVERY_DAYS = 10;

export function deliverBy(orderDate: string | Date | undefined | null): Date {
  const d = new Date(orderDate || Date.now());
  d.setDate(d.getDate() + DELIVERY_DAYS);
  return d;
}

export const deliverByLabel = (orderDate: string | Date | undefined | null): string =>
  deliverBy(orderDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

/** Show the promise only while the order is on its way */
export const showsDeliverBy = (status?: string) => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(String(status));
