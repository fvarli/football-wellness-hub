import { NextResponse } from "next/server";
import { submitBulkTrainingSessions } from "@/lib/data/service";
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
  const result = await submitBulkTrainingSessions(body);
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json({ sessions: result.data }, { status: 201 });
}
