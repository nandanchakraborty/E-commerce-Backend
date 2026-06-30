const { prisma } = require("../config/prisma");

//create category
const createCategory = async (normalizedName) => {
	try {
		const name = normalizedName.toLowerCase().trim();

		const newCategory = await prisma.category.create({
			data: { name },
			select: {
				id: true,
				name: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return newCategory;
	} catch (err) {
		console.error("database error:", err);
		throw err;
	}
};

// GET all categories
const getAllCategories = async () => {
	return prisma.category.findMany({
		select: {
			id: true,
			name: true,
			createdAt: true,
			updatedAt: true,
		},
	});
};

// UPDATE category
const updateCategory = async (id, name) => {
	const updated = await prisma.category.update({
		where: { id },
		data: {
			name: name.toLowerCase().trim(),
		},
	});

	return updated;
};

// DELETE category
const deleteCategory = async (id) => {
	return prisma.category.delete({
		where: { id },
	});
};
//get category by id
const getCategoryById = async (id) => {
	return prisma.category.findUnique({
		where: {
			id,
		},
	});
};

const isProductExist = async (name) => {
	return prisma.product.findFirst({
		where: {
			name,
		},
	});
};
//create product
const createProduct = async (data) => {
	return prisma.product.create({
		data: {
			name: data.name,
			description: data.description,
			price: data.price,
			stock: data.stock,
			categoryId: data.categoryId,
		},
	});
};

// update product
const updateProduct = async (id, data) => {
	return prisma.product.update({
		where: { id },
		data,
	});
};

// get product by id
const getProductById = async (id) => {
	return prisma.product.findUnique({
		where: { id },
		include: {
			category: true,
		},
	});
};
const deleteProduct = async (id) => {
	return prisma.product.delete({
		where: {
			id,
		},
	});
};
const getDashboard = async () => {
	const [
		totalUsers,
		totalProducts,
		totalOrders,
		pendingOrders,
		paidOrders,
		cancelledOrders,
		lowStockProducts,
		revenueResult,
		recentOrders,
	] = await Promise.all([
		prisma.user.count(),

		prisma.product.count(),

		prisma.order.count(),

		prisma.order.count({
			where: {
				status: "PENDING",
			},
		}),

		prisma.order.count({
			where: {
				status: "PAID",
			},
		}),

		prisma.order.count({
			where: {
				status: "CANCELLED",
			},
		}),

		prisma.product.count({
			where: {
				stock: {
					lte: 5,
				},
			},
		}),

		prisma.payment.aggregate({
			where: {
				status: "COMPLETED",
			},
			_sum: {
				amount: true,
			},
		}),

		prisma.order.findMany({
			orderBy: {
				createdAt: "desc",
			},
			take: 5,

			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		}),
	]);
	const monthlyRevenue = await prisma.payment.groupBy({
		by: ["paidAt"],

		where: {
			status: "COMPLETED",
		},

		_sum: {
			amount: true,
		},
	});
	const topProducts = await prisma.orderItem.groupBy({
		by: ["productId"],

		_sum: {
			quantity: true,
		},

		orderBy: {
			_sum: {
				quantity: "desc",
			},
		},

		take: 5,
	});
	const topCustomers = await prisma.order.groupBy({
		by: ["userId"],

		_count: true,

		orderBy: {
			_count: {
				userId: "desc",
			},
		},

		take: 5,
	});

	return {
		totalUsers,
		totalProducts,
		totalOrders,
		topProducts,

		pendingOrders,
		paidOrders,
		cancelledOrders,
		topCustomers,

		lowStockProducts,
		monthlyRevenue,

		totalRevenue: Number(revenueResult._sum.amount || 0),

		recentOrders,
	};
};
const getReviewsByProduct =
async (productId) => {

    return prisma.review.findMany({
        where: {
            productId,
        },

        include: {
            user: true,
            product: true,
        },

        orderBy: {
            createdAt: "desc",
        },
    });
};
const getAllReviews =
async () => {

    return prisma.review.findMany({

        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },

            product: {
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
	getReviewsByProduct,
	getAllCategories,
	updateCategory,
	deleteCategory,
	createCategory,
	getCategoryById,
	isProductExist,
	createProduct,
	updateProduct,
	getProductById,
	deleteProduct,
	getDashboard,
	getAllReviews,

};
