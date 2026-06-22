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

module.exports = {
    getProducts,
    findCart,
    cartCreate,
    addToCart,
    updateCartItem,
    findProductById,
    findCartItem,
    deleteCartItem,

    

}