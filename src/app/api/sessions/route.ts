import { NextResponse } from "next/server";
import { submitTrainingSession } from "@/lib/data/service";
import { getCurrentUser, hasRole } from "@/lib/auth-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ errors: [{ message: "Not authenticated" }] }, { status: 401 });

  // Only coaches and admins can log training sessions
  if (!hasRole(user, ["admin", "coach"])) {
    return NextResponse.json({ errors: [{ message: "Only coaches and admins can log sessions" }] }, { status: 403 });
  }

  const body = await request.json();
  const result = await submitTrainingSession(body);

  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}
