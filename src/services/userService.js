const { prisma } = require("../config/prisma"); 

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

    

}