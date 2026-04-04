import { NextResponse } from "next/server";
import { submitWellnessCheckIn, updateWellnessCheckIn } from "@/lib/data/service";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await submitWellnessCheckIn(body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const entryId = body?.entryId;

  if (typeof entryId !== "string" || entryId.length === 0) {
    return NextResponse.json(
      { errors: [{ field: "entryId", message: "entryId is required for updates" }] },
      { status: 400 },
    );
  }

  const result = await updateWellnessCheckIn(entryId, body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 200 });
}
