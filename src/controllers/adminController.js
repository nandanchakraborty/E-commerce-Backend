const router = require("../routes/adminRoutes");
const adminService = require("../services/adminService");
const config = require("../config/config");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const addCategory = async (req, res) => {
	try {
		const { name } = req.body;

		if (!name) {
			return res.status(400).json({
				msg: "Category name needed",
			});
		}

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
const updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { name } = req.body;

		if (!name) {
			return res.status(400).json({
				error: "Category name required",
			});
		}

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

const addProduct = async (req, res) => {
	const { name, description, price, stock, categoryId } = req.body;

	try {
		if (
			!name ||
			!description ||
			price === null ||
			stock === null ||
			!categoryId
		) {
			return res.status(400).json({
				error: "Need to fill all fields",
			});
		}

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
			message: "Product created successfully",
		});
	} catch (err) {
		console.error(err);

		return res.status(500).json({
			error: "Internal server error",
		});
	}
};

module.exports = {
	addCategory,
	getCategories,
	updateCategory,
	deleteCategory,
	addProduct,
};
