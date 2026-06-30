/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *         categoryId:
 *           type: string
 */

const router = require("../routes/adminRoutes");
const adminService = require("../services/adminService");
const config = require("../config/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/**
 * @swagger
 * /admin/addCategory:
 *   post:
 *     summary: Add a new category
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category added successfully
 *       400:
 *         description: Category name needed
 *       409:
 *         description: Category already exists
 *       500:
 *         description: Internal server error
 */
const addCategory = async (req, res) => {
	try {
		const { name } = req.body;

		

		const category = await adminService.createCategory(name);

		return res.status(201).json({
			category,
			msg: "Category added successfully",
		});
	} catch (err) {
		if (err.code === "P2002") {
			return res.status(409).json({
				error: "Category already exists",
			});
		}

		console.error(err);

		return res.status(500).json({
			error: "Internal server error",
		});
	}
};
/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of categories
 *       500:
 *         description: Failed to fetch categories
 */
const getCategories = async (req, res) => {
	try {
		const categories = await adminService.getAllCategories();

		return res.status(200).json({
			categories,
		});
	} catch (err) {
		return res.status(500).json({
			error: "Failed to fetch categories",
		});
	}
};
/**
 * @swagger
 * /admin/category/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Category name required
 *       500:
 *         description: Failed to update category
 */
const updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body;

		

		const updated = await adminService.updateCategory(id, name);

		return res.status(200).json({
			message: "Category updated successfully",
			category: updated,
		});
	} catch (err) {
		return res.status(500).json({
			error: "Failed to update category",
		});
	}
};
/**
 * @swagger
 * /admin/category/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       500:
 *         description: Failed to delete category
 */
const deleteCategory = async (req, res) => {
	try {
		const { id } = req.params;

		await adminService.deleteCategory(id);

		return res.status(200).json({
			message: "Category deleted successfully",
		});
	} catch (err) {
		return res.status(500).json({
			error: "Failed to delete category",
		});
	}
};

/**
 * @swagger
 * /admin/addProduct:
 *   post:
 *     summary: Add a new product
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - stock
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Need to fill all fields
 *       404:
 *         description: Category not found
 *       409:
 *         description: Product already exists
 *       500:
 *         description: Internal server error
 */
const addProduct = async (req, res) => {
	const { name, description, price, stock, categoryId } = req.body;

	try {
		const existingProduct = await adminService.isProductExist(name);

		if (existingProduct) {
			return res.status(409).json({
				error: "Product already exists",
			});
		}

		const category = await adminService.getCategoryById(categoryId);

		if (!category) {
			return res.status(404).json({
				error: "Category not found",
			});
		}

		const product = await adminService.createProduct({
			name,
			description,
			price,
			stock,
			categoryId,
		});

		return res.status(201).json({
			product,
			message: "Product added successfully",
		});
	} catch (err) {
		console.error(err);

		return res.status(500).json({
			error: "Internal server error",
		});
	}
};

/**
 * @swagger
 * /admin/updateProduct/{productId}:
 *   patch:
 *     summary: Update a product
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Product ID is required or missing fields
 *       404:
 *         description: Category not found
 *       409:
 *         description: Another product with this name already exists
 *       500:
 *         description: Internal server error
 */
const updateProduct = async(req,res) =>{
	try {
		const { productId } = req.params;
		const { name, description, price, stock, categoryId } = req.body;

		if (!productId) {
			return res.status(400).json({
				error: "Product ID is required",
			});
		}

		

		const existingProduct = await adminService.isProductExist(name);

		if (existingProduct && existingProduct.id !== productId) {
			return res.status(409).json({
				error: "Another product with this name already exists",
			});
		}

		const category = await adminService.getCategoryById(categoryId);

		if (!category) {
			return res.status(404).json({
				error: "Category not found",
			});
		}

		const updatedProduct = await adminService.updateProduct(productId, {
			name,
			description,
			price,
			stock,
			categoryId,
		});

		return res.status(200).json({
			product: updatedProduct,
			message: "Product updated successfully",
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({
			error: "Internal server error",
		});
	}
};
/**
 * @swagger
 * /admin/getProduct/{productId}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product fetched successfully
 *       400:
 *         description: No product found
 *       500:
 *         description: Internal server error
 */
const getProductByID = async(req,res)=>{
	try{
	const {productId} = req.params;
	const getPoduct = await adminService.getProductById(productId);
	if(getPoduct){
		return res.status(200).json({success,msg:'product fetch successfull',getPoduct})
	}
	else{
		return res.status(400).json({err,msg:'No product found'})
	}
	}catch(err){
		console.log(err);
		return res.status(500).json({msg:'internal server error'});

	}

}
/**
 * @swagger
 * /admin/delete-products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product deleted successfully
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Product not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    await adminService.deleteProduct(id);

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data fetched successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
const getDashboard = async (
    req,
    res
) => {
    try {

        const dashboard =
            await adminService
                .getDashboard();

        return res.status(200).json({
            success: true,
            data: dashboard,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};
const getReviewsByProduct =
async (
    req,
    res
) => {

    try {

        const { productId } =
            req.params;

        const reviews =
            await adminService
                .getReviewsByProduct(
                    productId
                );

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};
const getAllReviews = async (
    req,
    res
) => {

    try {

        const reviews =
            await adminService
                .getAllReviews();

        return res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews,
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

module.exports = {
	getReviewsByProduct,
	getAllReviews,
	addCategory,
	getCategories,
	updateCategory,
	deleteCategory,
	addProduct,
	updateProduct,
	getProductByID,
	deleteProduct,
	getDashboard,
};
