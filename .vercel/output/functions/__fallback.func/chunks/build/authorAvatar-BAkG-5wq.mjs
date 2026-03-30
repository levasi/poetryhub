function dicebearAuthorUrl(slug, name) {
  const seed = encodeURIComponent((slug == null ? void 0 : slug.trim()) || (name == null ? void 0 : name.trim()) || "author");
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=f5f5f0`;
}
function authorAvatarUrl(author) {
  var _a;
  if (!author) {
    return "https://api.dicebear.com/7.x/notionists/svg?seed=unknown&backgroundColor=f5f5f0";
  }
  const url = (_a = author.imageUrl) == null ? void 0 : _a.trim();
  if (url) return url;
  return dicebearAuthorUrl(author.slug, author.name);
}

export { authorAvatarUrl as a };
//# sourceMappingURL=authorAvatar-BAkG-5wq.mjs.map
