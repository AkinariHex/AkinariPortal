import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "invalid token" }, { status: 401 });
  }

  try {
    revalidatePath("/");
    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ message: "Error Revalidating" }, { status: 500 });
  }
}
