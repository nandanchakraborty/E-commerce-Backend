const { prisma } = require("../config/prisma"); 
 const isExist  = async(email) => {
	return await prisma.user.findUnique({ where: { email } });

 
 }
 const createNewUser = async (createUser) => {
  try {
    const newUser = await prisma.user.create({
      data: {
        name: createUser.name,
        email: createUser.email,
        password: createUser.password,
        role: createUser.role || "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newUser;
  } catch (err) {
    console.error("database insertion error:", err);
    throw err;
  }
};


module.exports = {
    createNewUser,
    isExist ,
    
}


