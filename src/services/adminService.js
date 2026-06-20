const { prisma } = require("../config/prisma");

//create category
const createCategory = async (normalizedName) => {
	try {
      const name = normalizedName.toLowerCase().trim();

		const newCategory = await prisma.category.create({
			data: { name},
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

module.exports = {
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
};
