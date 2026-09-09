export const getPublicUrl = (path: string) => {
  const origin = window.location.origin.replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;

  return `${origin}${normalized}`;
};

export const openShareWindow = (shareUrl: string) => {
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=640,height=640");
};

export const getFacebookShareUrl = (url: string) => {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
};

export const getTwitterShareUrl = (url: string, title: string) => {
  return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
};

export const getWhatsAppShareUrl = (url: string, title: string) => {
  return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
};

export const copyTextToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "absolute";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};
