import bcrypt from "bcryptjs";

const SALT_ROUND = 12;
export const hashPassword = async (plainText: string): Promise<string> => {
  return await bcrypt.hash(plainText, SALT_ROUND);
};

export const verifyPassword = async (plaintext: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plaintext, hash);
};
