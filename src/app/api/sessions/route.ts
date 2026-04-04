import { NextResponse } from "next/server";
import { submitTrainingSession } from "@/lib/data/service";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await submitTrainingSession(body);

  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 201 });
}
