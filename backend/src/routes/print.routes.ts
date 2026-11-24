import { Router, Request, Response } from 'express';
import { prisma } from '@/index';
import { verifyPrintToken } from '@/utils/printToken';

const router = Router();

/** Order details for the printable shipping label and bill. Opened from the team order email. */
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!verifyPrintToken(id, req.query.t)) {
      res.status(403).json({ success: false, message: 'This print link is not valid.' });
      return;
    }
    const o = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { select: { productName: true, quantity: true, pricePerMeter: true, total: true } },
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });
    if (!o) { res.status(404).json({ success: false, message: 'Order not found' }); return; }
    let address: any = {};
    try { address = JSON.parse(o.shippingAddress || '{}'); } catch { /* keep empty */ }
    res.set('Cache-Control', 'no-store');
    res.json({
      success: true,
      data: {
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        status: o.status,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        subtotal: o.subtotal,
        shippingCost: o.shippingCost,
        discountAmount: o.discountAmount,
        couponCode: o.couponCode,
        total: o.total,
        customerPhone: o.customerPhone,
        trackingNumber: o.trackingNumber,
        address,
        customer: o.user,
        items: o.items,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Could not load the order' });
  }
});

export default router;
