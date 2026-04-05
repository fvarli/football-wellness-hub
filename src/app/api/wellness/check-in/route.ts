import { NextResponse } from "next/server";
import { submitWellnessCheckIn, updateWellnessCheckIn } from "@/lib/data/service";
import { getCurrentUser, canAccessPlayer } from "@/lib/auth-utils";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ errors: [{ message: "Not authenticated" }] }, { status: 401 });

  const body = await request.json();

  // Players: force their own playerId. Coaches/admins: allow specifying playerId.
  const playerId = user.role === "player" ? user.playerId : (body.playerId ?? user.playerId);
  if (!playerId) return NextResponse.json({ errors: [{ field: "playerId", message: "playerId required" }] }, { status: 400 });

  if (!canAccessPlayer(user, playerId)) {
    return NextResponse.json({ errors: [{ message: "Not authorized for this player" }] }, { status: 403 });
  }

  const result = await submitWellnessCheckIn({ ...body, playerId });
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result.data, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ errors: [{ message: "Not authenticated" }] }, { status: 401 });

  const body = await request.json();
  const entryId = body?.entryId;
  if (typeof entryId !== "string" || !entryId) {
    return NextResponse.json({ errors: [{ field: "entryId", message: "entryId required" }] }, { status: 400 });
  }

  const playerId = user.role === "player" ? user.playerId : (body.playerId ?? user.playerId);
  if (!playerId) return NextResponse.json({ errors: [{ field: "playerId", message: "playerId required" }] }, { status: 400 });

  if (!canAccessPlayer(user, playerId)) {
    return NextResponse.json({ errors: [{ message: "Not authorized for this player" }] }, { status: 403 });
  }

  const result = await updateWellnessCheckIn(entryId, { ...body, playerId });
  if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 });
  return NextResponse.json(result.data, { status: 200 });
}
