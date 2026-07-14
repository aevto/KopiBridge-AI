import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsedId = z.uuid().safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid report identifier." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: "Sign in to delete this report." },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", authData.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "The report could not be deleted." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
