"use server";

import { neon } from "@neondatabase/serverless";
import { compare, hash } from "bcrypt";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

export async function loginUser(email: string, password: string) {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const users =
      await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;

    if (users && users.length > 0) {
      const user = users[0];
      const passwordMatch = await compare(password, user.password_hash);

      if (passwordMatch) {
        // Create a new TextEncoder
        const textEncoder = new TextEncoder();

        // Convert JWT_SECRET to Uint8Array
        const secret = textEncoder.encode(process.env.JWT_SECRET!);

        // Create JWT token using jose
        const token = await new SignJWT({ userId: user.id })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("1d")
          .setIssuedAt()
          .sign(secret);

        const cookie = await cookies();
        cookie.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 3600,
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
          },
        };
      }
    }

    return { success: false, error: "Invalid credentials" };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function registerUser(
  email: string,
  password: string,
  acceptedTerms: boolean
) {
  if (!acceptedTerms) {
    return {
      success: false,
      error: "You must accept the terms and conditions",
    };
  }

  const sql = neon(process.env.DATABASE_URL!);

  try {
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "User already exists" };
    }

    const hashedPassword = await hash(password, 10);
    const newUsers = await sql`
            INSERT INTO users (email, password_hash) 
            VALUES (${email}, ${hashedPassword}) 
            RETURNING id, email
        `;

    const newUser = newUsers[0];
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret is not defined");
    }
    // Create a new TextEncoder
    const textEncoder = new TextEncoder();

    // Convert JWT_SECRET to Uint8Array
    const secret = textEncoder.encode(process.env.JWT_SECRET);

    // Create JWT token using jose
    const token = await new SignJWT({ userId: newUser.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .setIssuedAt()
      .sign(secret);

    const cookie = await cookies();
    cookie.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
    });

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
      },
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}


export async function logoutUser() {
  const cookie = await cookies();
  cookie.delete("auth_token");

  // Redirect the user to the login page

  return {
    success: true,
    message: "Logged out successfully",
  };
}
