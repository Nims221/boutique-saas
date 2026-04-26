import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

function sanitizeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const rawBase = path.basename(name, ext);

  const base = rawBase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${base || "product"}-${Date.now()}${ext}`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Aucun fichier reçu." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Format invalide. Utilise JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "Fichier trop volumineux. Maximum 5 MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = sanitizeFileName(file.name);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");

    await mkdir(uploadDir, { recursive: true });

    const absolutePath = path.join(uploadDir, fileName);
    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      success: true,
      url: `/uploads/products/${fileName}`,
      message: "Image uploadée avec succès.",
    });
  } catch (error) {
    console.error("Upload image error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erreur pendant l'upload de l'image.",
      },
      { status: 500 }
    );
  }
}