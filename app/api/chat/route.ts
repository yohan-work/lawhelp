import { NextResponse } from "next/server";
import { loadDatasets } from "@/lib/data/loadDatasets";
import { runMatchEngine } from "@/lib/match/engine";
import { z } from "zod";

const bodySchema = z.object({
  question: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          matched: false,
          fallbackMessage: "질문 형식이 올바르지 않습니다.",
        },
        { status: 400 },
      );
    }

    const { question } = parsed.data;
    const datasets = await loadDatasets();
    const result = runMatchEngine(question, datasets);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        ok: false,
        matched: false,
        fallbackMessage: "데이터를 불러오거나 처리하는 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
