import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
	throw new Error('JWT_SECRET environment variable is required in auth module');
}

export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}