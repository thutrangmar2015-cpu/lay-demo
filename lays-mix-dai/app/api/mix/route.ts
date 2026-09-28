import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CHALLENGES, FLAVORS } from "@/lib/config";
import type { MixResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const client = new Anthropic(); // đọc ANTHROPIC_API_KEY từ env
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SYSTEM = `Bạn là "AI tính toán đại đại" của Lay's trong một web game.
Key message: Lay's giòn chấn động, nên mix đại đại với gì cũng vẫn ngon.

Nhiệm vụ: nhìn ảnh người chơi chụp, tìm MỘT chi tiết trong ảnh, rồi "bắc cầu" sang MỘT nguyên liệu ăn được để mix với Lay's.

Cách bắc cầu (chọn 1): trùng màu, giống hình dáng, chơi chữ tên gọi, hoặc liên tưởng đời thường mà người Việt hiểu ngay.
Ví dụ: áo đỏ -> tương cà; hộp cơm xanh -> dưa leo; bàn phím -> bánh tráng (vì cũng vuông vức, xếp hàng).

Luật bắt buộc:
- Bất ngờ nằm ở CẦU NỐI, còn công thức cuối cùng phải ăn được thật, an toàn, và nghe hợp lý là ngon.
- Nguyên liệu phổ biến, dễ mua ở Việt Nam. Không dùng đồ uống có cồn, không dùng đồ sống/tái nguy hiểm.
- Nếu ảnh có người: chỉ nói về đồ vật, quần áo, màu sắc. Tuyệt đối không nhận xét ngoại hình, cơ thể, tuổi, giới tính, sắc tộc.
- Nếu ảnh mờ hoặc khó nhận ra: bắc cầu từ màu chủ đạo của ảnh, vẫn trả kết quả.
- Nếu ảnh có nội dung nhạy cảm, bạo lực, người lớn: đặt seen = "một thứ AI xin phép không nhìn kỹ", bắc cầu sang một nguyên liệu trung tính.
- Chỉ dùng đúng tên vị Lay's trong danh sách được cung cấp. Không bịa vị mới, không bịa công dụng hay số liệu.
- Giọng văn: tiếng Việt, tự nhiên, hài kiểu bạn bè nói chuyện, ngắn. Không sến, không chơi chữ gượng, không dùng dấu gạch ngang dài.`;

const TOOL: Anthropic.Tool = {
  name: "tra_cong_thuc",
  description: "Trả công thức mix Lay's cho người chơi",
  input_schema: {
    type: "object",
    properties: {
      seen: { type: "string", description: "Chi tiết AI chọn trong ảnh, tối đa 8 từ" },
      bridge: { type: "string", description: "1 câu giải thích hài hước vì sao chi tiết đó dẫn tới nguyên liệu, tối đa 25 từ" },
      ingredient: { type: "string", description: "Nguyên liệu ăn được, 1-4 từ" },
      ingredientEmoji: { type: "string", description: "1 emoji cho nguyên liệu" },
      partner: { type: "string", description: "Món thứ 3 đi kèm cho tròn công thức, 1-4 từ" },
      partnerEmoji: { type: "string", description: "1 emoji cho món đi kèm" },
      mixName: { type: "string", description: "Tên công thức vui, tối đa 6 từ" },
      steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 3, description: "Các bước làm, mỗi bước tối đa 14 từ" },
      verdict: { type: "string", description: "1 câu chốt vì sao vẫn ngon nhờ độ giòn của Lay's, tối đa 16 từ" },
      crunch: { type: "integer", minimum: 7, maximum: 10, description: "Độ giòn chấn động" },
      flavor: { type: "string", enum: FLAVORS.map((f) => f.name) },
    },
    required: ["seen", "bridge", "ingredient", "ingredientEmoji", "partner", "partnerEmoji", "mixName", "steps", "verdict", "crunch", "flavor"],
  },
};

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  try {
    const { image, challengeId, avoid } = (await req.json()) as {
      image?: string; challengeId?: string; avoid?: string[];
    };

    const m = image?.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!m || !ALLOWED.has(m[1])) {
      return NextResponse.json({ error: "Ảnh không hợp lệ. Hãy chụp lại hoặc chọn ảnh JPG/PNG." }, { status: 400 });
    }
    if (m[2].length > 4_000_000) {
      return NextResponse.json({ error: "Ảnh quá nặng. Hãy chọn ảnh nhỏ hơn." }, { status: 413 });
    }

    const ch = CHALLENGES.find((c) => c.id === challengeId);
    const avoidList = (avoid || []).slice(0, 5).map((s) => String(s).slice(0, 40));

    const userText = [
      ch ? `Thử thách người chơi nhận: ${ch.top} ${ch.main} ${ch.sub}.` : "",
      `Vị Lay's được phép dùng: ${FLAVORS.map((f) => f.name).join(", ")}.`,
      avoidList.length ? `Người chơi bấm "Thử món khác". Chọn chi tiết khác hoặc nguyên liệu khác, tránh: ${avoidList.join(", ")}.` : "",
      "Hãy trả công thức bằng tool tra_cong_thuc.",
    ].filter(Boolean).join("\n");

    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: SYSTEM,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: m[1] as "image/jpeg", data: m[2] } },
          { type: "text", text: userText },
        ],
      }],
    });

    const block = msg.content.find((b) => b.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("no tool_use");
    const r = block.input as MixResult;
    r.crunch = Math.min(10, Math.max(7, Math.round(Number(r.crunch) || 9)));
    r.steps = (r.steps || []).slice(0, 3);
    return NextResponse.json(r);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI đang quá tải vì bị thách nhiều quá. Thử lại sau vài giây nhé." }, { status: 500 });
  }
}
