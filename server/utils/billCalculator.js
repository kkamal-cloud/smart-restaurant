const calculateBill = (orderItems, taxRate = 5, discount = 0) => {
  const subtotal = orderItems.reduce((acc, item) => acc + (item.quantity * item.priceAtOrderTime), 0);
  const tax = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + tax - discount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxRate,
    discount: Number(discount.toFixed(2)),
    grandTotal: Math.max(0, Number(grandTotal.toFixed(2))),
  };
};

module.exports = calculateBill;
