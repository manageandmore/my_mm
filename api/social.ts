import { generatePostImage } from "../src/features/post_generator/generator";

/**
 * Configures the vercel deployment to use the edge runtime.
 */
export const config = {
  runtime: "edge",
};

/**
 * Handler for the /api/social route.
 *
 * Renders a social post image from a set of options.
 *  */
export default async function social(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let params = Object.fromEntries(searchParams.entries());

    if (params["d"] != null) {
      params = Object.assign(JSON.parse(atob(params["d"])), params);
    }

    const size = Number(params["size"] ?? "800");

    return generatePostImage({
      size: size,
      title: params["title"] ?? "",
      subtitle: params["subtitle"] ?? "",
      logoPosition: params["logoPosition"] ?? "top",
      titleColor: params["titleColor"] ?? "white",
      titleAlignment: params["titleAlignment"] ?? "left",
      download: params["download"] != null,
      image:
        params["image"] ??
        `https://placehold.co/${size}x${size}/19A5CE/4DB8D6/png?text=Background\\nImage`,
      file: params["file"],
    });
  } catch (e: any) {
    console.log(`ERROR: ${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
