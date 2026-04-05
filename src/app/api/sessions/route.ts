import { NextResponse } from "next/server";
import { submitTrainingSession, updateTrainingSession, deleteTrainingSession } from "@/lib/data/service";
import { getCurrentUser, hasRole } from "@/lib/auth-utils";

function unauthorized() {
  return NextResponse.json({ errors: [{ message: "Not authenticated" }] }, { status: 401 });
}
function forbidden() {
  return NextResponse.json({ errors: [{ message: "Only coaches and admins can manage sessions" }] }, { status: 403 });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["admin", "coach"])) return forbidden();

  const body = await request.json();
  const result = await submitTrainingSession(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["admin", "coach"])) return forbidden();

  const body = await request.json();
  const sessionId = body?.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ errors: [{ field: "sessionId", message: "sessionId required" }] }, { status: 400 });
  }

  const result = await updateTrainingSession(sessionId, body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result.data, { status: 200 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!hasRole(user, ["admin", "coach"])) return forbidden();

  const body = await request.json();
  const sessionId = body?.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ errors: [{ field: "sessionId", message: "sessionId required" }] }, { status: 400 });
  }

  const result = await deleteTrainingSession(sessionId);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result.data, { status: 200 });
}
