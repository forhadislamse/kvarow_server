import { Prisma, UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import * as bcrypt from "bcrypt";
import config from "../../config";


export const initiateSuperAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash(
      '12345678',
      Number(config.bcrypt_salt_rounds)
    );
 
    const payload: Prisma.UserCreateInput = {
      email: "superadmin@gmail.com",
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    };
 
    const isExistUser = await prisma.user.findFirst({
      where: { email: payload.email },
    });
 
    if (isExistUser) {
      console.log("Super admin already exist!");
      return;
    };
 
    await prisma.user.create({
      data: payload,
    });
    console.log("Super admin created successfully!");
  } catch (error) {
    console.error(" Super admin init failed:", error);
  }
};