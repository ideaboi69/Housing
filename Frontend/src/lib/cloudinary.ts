type Opts = {
  w?: number;
  h?: number;
  q?: "auto" | number;
  fit?: "fill" | "fit" | "limit" | "thumb";
};

export function cloudinaryUrl(url: string | null | undefined, opts: Opts = {}): string {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;
  if (url.includes("/upload/") === false) return url;

  const parts: string[] = ["f_auto", `q_${opts.q ?? "auto"}`];
  if (opts.w) parts.push(`w_${opts.w}`);
  if (opts.h) parts.push(`h_${opts.h}`);
  if (opts.fit) parts.push(`c_${opts.fit}`);

  const transform = parts.join(",");
  return url.replace("/upload/", `/upload/${transform}/`);
}
