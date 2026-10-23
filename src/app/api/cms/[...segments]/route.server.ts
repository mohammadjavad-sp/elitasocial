import { handleCmsRequest } from "@/server/cms-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = handleCmsRequest;
export const POST = handleCmsRequest;
export const PUT = handleCmsRequest;
export const DELETE = handleCmsRequest;
