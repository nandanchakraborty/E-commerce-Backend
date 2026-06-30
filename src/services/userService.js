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
const createCart = async(userId) => {
    return prisma.cart.create({
        data: {userId :userId}
    })
    
}
const findProductById = async (productId) => {
    return prisma.product.findUnique({
        where: {
            id:productId,
        },
    });
};
const findCartItem = async (cartId, productId) => {
    return prisma.cartItem.findFirst({
        where: {
            cartId,
            productId: productId,
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
            productId: productId,
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

    if (order.status === "PAID") {
    throw new Error("Order is already paid");
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
const createOrder = async (userId, payload) => {
    const { shippingAddress, phone, items } = payload;

    return await prisma.$transaction(async (tx) => {
        let total = 0;
        const orderItems = [];

        for (const item of items) {

            const product = await tx.product.findUnique({
                where: {
                    id: item.productId,
                },
            });

            if (!product) {
                throw new Error(
                    `Product ${item.productId} not found`
                );
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

                items: {
                    create: orderItems,
                },
            },

            include: {
                items: true,
                user:true,
            },
        });
        await tx.payment.create({
    data: {
        orderId: order.id,
        method: "CARD",
        amount: total,
        status: "PENDING",
    },
});

        return order;
    });
};
const handlePaymentSuccess =
    async (session) => {

        const orderId =
            session.metadata.orderId;

        await prisma.$transaction([

            prisma.payment.update({
                where: {
                    orderId,
                },

                data: {
                    status:
                        "COMPLETED",

                    paidAt:
                        new Date(),

                    transactionId:
                        session.payment_intent,
                },
            }),

            prisma.order.update({
                where: {
                    id: orderId,
                },

                data: {
                    status:
                        "PAID",
                },
            }),

        ]);
    };

const updateProfile = async (
    userId,
    payload
) => {

    const { name, email } = payload;

    if (email) {

        const existingUser =
            await prisma.user.findFirst({
                where: {
                    email,
                    NOT: {
                        id: userId,
                    },
                },
            });

        if (existingUser) {
            throw new Error(
                "Email already exists"
            );
        }
    }

    return await prisma.user.update({
        where: {
            id: userId,
        },

        data: {
            name,
            email,
        },

        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
};
const cancelOrder = async (orderId) => {
    return await prisma.$transaction(async (tx) => {

        const order = await tx.order.findUnique({
            where: {
                id: orderId,
            },
            include: {
                items: true,
                user : true,
            },
        });

       
        // Restore stock
        for (const item of order.items) {

            await tx.product.update({
                where: {
                    id: item.productId,
                },
                data: {
                    stock: {
                        increment: item.quantity,
                    },
                },
            });

        }
        if (
    order.payment &&
    order.payment.status === "COMPLETED"
) {
    throw new Error(
        "Paid orders require refund process"
    );
}

        // Update order status
        const updatedOrder =
            await tx.order.update({
                where: {
                    id: orderId,
                },
                data: {
                    status: "CANCELLED",
                },
                include: {
                    items: true,
                },
            });

        return updatedOrder;
    });
};
const createReview = async (
    userId,
    productId,
    payload
) => {

    const purchased =
        await prisma.orderItem.findFirst({
            where: {
                productId,

                order: {
                    userId,

                    status: {
                        in: [
                            "PAID",
                            "DELIVERED",
                        ],
                    },
                },
            },
        });

    if (!purchased) {
        throw new Error(
            "You must purchase this product before reviewing"
        );
    }

    const existingReview =
        await prisma.review.findFirst({
            where: {
                userId,
                productId,
            },
        });

    if (existingReview) {
        throw new Error(
            "You already reviewed this product"
        );
    }

    return prisma.review.create({
        data: {
            userId,
            productId,
            rating: payload.rating,
            comment: payload.comment,
        },
    });
};
const updateReview = async (
    reviewId,
    userId,
    payload
) => {

    const review =
        await prisma.review.findUnique({
            where: {
                id: reviewId,
            },
        });

    if (!review) {
        throw new Error(
            "Review not found"
        );
    }

    if (review.userId !== userId) {
        throw new Error(
            "Unauthorized"
        );
    }

    return prisma.review.update({
        where: {
            id: reviewId,
        },
        data: {
            rating: payload.rating,
            comment: payload.comment,
        },
    });
};
const deleteReview = async (
    reviewId,
    userId
) => {

    const review =
        await prisma.review.findUnique({
            where: {
                id: reviewId,
            },
        });

    if (!review) {
        throw new Error(
            "Review not found"
        );
    }

    if (review.userId !== userId) {
        throw new Error(
            "Unauthorized"
        );
    }

    await prisma.review.delete({
        where: {
            id: reviewId,
        },
    });

    return true;
};
const getProductReviews =
async (productId) => {

    return prisma.review.findMany({
        where: {
            productId,
        },

        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },

        orderBy: {
            createdAt: "desc",
        },
    });
};

module.exports = {
    createReview,
    updateReview,
    deleteReview,
    getProductReviews,
    updateProfile,
    getProducts,
    findCart,
    createCart,
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
    handlePaymentSuccess,
    cancelOrder,

    

}