import { faker } from '@faker-js/faker';

export function generateUsers(count: number) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      email: faker.internet.email(),
      name: faker.person.fullName(),
      phone: faker.phone.number({ style: 'national' }),
      role: 'USER',
    });
  }
  return users;
}

export function generateAddresses(userIds: string[], stateId: string, cityId: string, areaId: string) {
  const addresses = [];
  for (const userId of userIds) {
    const num = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < num; i++) {
      addresses.push({
        userId,
        label: i === 0 ? 'Home' : 'Work',
        address: faker.location.streetAddress(),
        city: 'Miami',
        area: 'Miami Gardens',
        state: 'Florida',
        stateId,
        cityId,
        areaId,
        isDefault: i === 0,
        recipientName: faker.person.fullName(),
        recipientPhone: faker.phone.number({ style: 'national' }),
      });
    }
  }
  return addresses;
}

export function generateReviews(productIds: string[], userIds: string[], count: number) {
  const reviews = [];
  for (let i = 0; i < count; i++) {
    reviews.push({
      productId: faker.helpers.arrayElement(productIds),
      rating: faker.number.int({ min: 3, max: 5 }),
      reviewer: faker.person.fullName(),
      reviewerEmail: faker.internet.email(),
      content: faker.helpers.arrayElement([
        faker.lorem.sentence(),
        "Great quality, very fresh!",
        "Delivery was super fast.",
        "Exactly what I needed for dinner.",
        "Will buy again.",
        "Good value for money.",
        "Highly recommended.",
      ]),
    });
  }
  return reviews;
}

export function generateOrders(userIds: string[], productIds: string[], addressIds: string[], count: number) {
  const orders = [];
  for (let i = 0; i < count; i++) {
    const itemCount = faker.number.int({ min: 1, max: 5 });
    const items = [];
    let total = 0;
    
    for (let j = 0; j < itemCount; j++) {
      // Fake price, actual DB would match product price but for seed speed it's fine
      const price = parseFloat(faker.commerce.price({ min: 5, max: 50 }));
      const qty = faker.number.int({ min: 1, max: 3 });
      total += price * qty;
      
      items.push({
        productId: faker.helpers.arrayElement(productIds),
        quantity: qty,
        price,
      });
    }

    orders.push({
      userId: faker.helpers.arrayElement(userIds),
      customerName: faker.person.fullName(),
      customerPhone: faker.phone.number({ style: 'national' }),
      deliveryAddress: faker.location.streetAddress(),
      deliveryCity: 'Miami',
      deliveryArea: 'Miami Gardens',
      deliveryState: 'Florida',
      subtotal: total,
      deliveryFee: 5.0,
      total: total + 5.0,
      status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DELIVERED', 'COMPLETED']),
      paymentStatus: faker.helpers.arrayElement(['PAID', 'UNPAID']),
      paymentMethod: faker.helpers.arrayElement(['COD', 'CARD', 'BKASH', 'NAGAD']),
      items,
    });
  }
  return orders;
}
