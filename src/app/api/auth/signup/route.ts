import { NextRequest, NextResponse } from "next/server";
import { AuthUtils } from "@/lib/auth-utils";

// POST /api/auth/signup - Register new user
export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const user = await AuthUtils.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          team: String(user.team),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
