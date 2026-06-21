// all business logic lives here

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';
import { AppError } from '../../utils/AppError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { emailQueue } from '../../queues/email.queue';
import type { RegisterInput, LoginInput } from './auth.schema';

// register user
export async function registerUser(input: RegisterInput) {
  // Check if email already exists
  const existingEmail = await db.query.users.findFirst({
    where: eq(users.email, input.email)
  });

  if(existingEmail) {
    throw new AppError('Email already in use', 409);
  };
  // Check if username already exists
  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, input.username)
  });

  if(existingUsername) {
    throw new AppError('username already in use', 409);
  };

  // Hash password
  const passwordHash = await bcrypt.hash(input.password, 12);

  // create user
  const [newUser] = await db
  .insert(users)
  .values({
    email: input.email,
    username: input.username,
    passwordHash,
    fullName: input.fullName,
  })
  .returning()

  // Queue welcome email — non-blocking, doesn't affect response time
  await emailQueue.add('welcone', {
    type: 'welcome',
    to: newUser.email,
    username: newUser.username,
  });

  // generate token
  const accessToken = generateAccessToken({userId: newUser.id, email: newUser.email});
  const refreshToken = generateRefreshToken({userId: newUser.id, email: newUser.email});

  // Never return the password hash to the client
  const { passwordHash: _, ...userWithoutPassword } = newUser;

  return { user: userWithoutPassword, accessToken, refreshToken };
}

// login user
export async function loginUser(input: LoginInput) {
  // find user by email
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email)
  });

  if(!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  
  if(!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

  const { passwordHash: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken, refreshToken };

}

// refresh access token
export async function refreshAccessToken(token: string) {
  try {
    const payload = verifyRefreshToken(token);

    // Make sure user still exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId)
    });

    if (!user) throw new AppError('User not found', 401);

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });

    return { accessToken };

  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
}

export async function getMe(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });

  if (!user) throw new AppError('User not found', 404);

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}