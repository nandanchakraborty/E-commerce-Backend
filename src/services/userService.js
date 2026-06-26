const { prisma } = require("../config/prisma"); 
const config = require('../config/config');
const Stripe = require("stripe");
const { v4: uuidv4 } = require("uuid");

const getProducts = async () => {
    return prisma.product.findMany({
        include: {
            category: true,
        },
    });
};

const findCart = async (userId) => {
    return prisma.cart.findUnique({
        where: {
            userId,
        },
    });
};
const cartCreate = async(userId) => {
    return prisma.cart.cartCreate({
        data: {userId :userId}
    })
    
}
const findProductById = async (productId) => {
    return prisma.product.findUnique({
        where: {
            id: Number(productId),
        },
    });
};
const findCartItem = async (cartId, productId) => {
    return prisma.cartItem.findFirst({
        where: {
            cartId,
            productId: Number(productId),
        },
    });
};
const updateCartItem = async (cartItemId, quantity) => {
    return prisma.cartItem.update({
        where: {
            id: cartItemId,
        },
        data: {
            quantity,
        },
    });
};
const addToCart = async ({ cartId, productId, quantity }) => {
    return prisma.cartItem.create({
        data: {
            cartId,
            productId: Number(productId),
            quantity,
        },
    });
};
const findCartItemById = async (id) => {
    return prisma.cartItem.findUnique({
        where: { id },
    });
};

const deleteCartItem = async (cartId, productId) => {
    return prisma.cartItem.deleteMany({
        where: {
            cartId,
            productId,
        },
    });
};

const createOrder = async (userId, payload) => {
    const { shippingAddress, phone, items } = payload;

    return await prisma.$transaction(async (tx) => {   //tx a special prisma client that works inside the transaction
        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await tx.product.findUnique({
                where: {
                    id: item.productId,
                },
            });

            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }

            const stockUpdate = await tx.product.updateMany({
                where: {
                    id: item.productId,
                    stock: {
                        gte: item.quantity,
                    },
                },
                data: {
                    stock: {
                        decrement: item.quantity,
                    },
                },
            });

            if (stockUpdate.count === 0) {
                throw new Error(
                    `${product.name} does not have enough stock`
                );
            }

            const subtotal =
                Number(product.price) * item.quantity;

            total += subtotal;

            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: Number(product.price),
            });
        }

        const order = await tx.order.create({
            data: {
                userId,
                shippingAddress,
                phone,
                total,

                orderItems: {
                    create: orderItems,
                },
            },
            include: {
                orderItems: true,
            },
        });

        return order;
    });
};
const getOrders = async () => {
    return prisma.order.findMany({
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            payment: true,
            user: true,
        },
    });
};

const getOrderById = async (id) => {
    return prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
            payment: true,
            user: true,
        },
    });
};


const stripe = Stripe(config.STRIPE_SECRET_KEY);

const createPaymentIntent = async (
  orderId,
  userId
) => {

  const order =
    await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payment: true,
      },
    });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "PAID") {
    throw new Error("Order already paid");
  }

  if (order.payment?.stripeIntentId) {

    const existingIntent =
      await stripe.paymentIntents.retrieve(
        order.payment.stripeIntentId
      );

    return {
      clientSecret:
        existingIntent.client_secret,
    };
  }

  const idempotencyKey = uuidv4();

  const paymentIntent =
    await stripe.paymentIntents.create(
      {
        amount:
          Math.round(
            Number(order.total) * 100
          ),

        currency: "usd",

        metadata: {
          orderId: order.id,
          userId,
        },
      },
      {
        idempotencyKey,
      }
    );

  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.total,
      method: "CARD",
      status: "PENDING",
      stripeIntentId:
        paymentIntent.id,
      idempotencyKey,
    },
  });

  return {
    clientSecret:
      paymentIntent.client_secret,
  };
};
const handleSuccess = async (
  paymentIntent
) => {

  const payment =
    await prisma.payment.findFirst({
      where: {
        stripeIntentId:
          paymentIntent.id,
      },
    });

  if (!payment) return;

  await prisma.$transaction(
    async (tx) => {

      await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: "COMPLETED",

          transactionId:
            String(
              paymentIntent.latest_charge
            ),

          paidAt: new Date(),
        },
      });

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          status: "PAID",
        },
      });

    }
  );
};
const handleFailure = async (
  paymentIntent
) => {

  const payment =
    await prisma.payment.findFirst({
      where: {
        stripeIntentId:
          paymentIntent.id,
      },
    });

  if (!payment) return;

  await prisma.payment.update({
    where: {
      id: payment.id,
    },
    data: {
      status: "FAILED",
    },
  });
};
const createCheckoutSession = async (
    orderId,
    userId
) => {

    const order =
        await prisma.order.findFirst({
            where: {
                id: orderId,
                userId,
            },
        });

    if (!order) {
        throw new Error("Order not found");
    }

    const session =
        await stripe.checkout.sessions.create({
            mode: "payment",

            line_items: [
                {
                    price_data: {
                        currency: "usd",

                        product_data: {
                            name: `Order ${order.id}`,
                        },

                        unit_amount:
                            Math.round(
                                Number(order.total) * 100
                            ),
                    },

                    quantity: 1,
                },
            ],

            success_url:
                "http://localhost:3000/success.html",

            cancel_url:
                "http://localhost:3000/cancel.html",

            metadata: {
                orderId: order.id,
            },
        });

    return {
        url: session.url,
    };
};

module.exports = {
    getProducts,
    findCart,
    cartCreate,
    addToCart,
    updateCartItem,
    findProductById,
    findCartItem,
    deleteCartItem,
    createOrder,
    getOrders,
    getOrderById,
    createPaymentIntent,
    handleSuccess,
    handleFailure,
    createCheckoutSession,

    

}