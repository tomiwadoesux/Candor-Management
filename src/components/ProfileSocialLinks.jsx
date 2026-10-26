import { Instagram } from "lucide-react";

function XIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933Zm-1.29 19.49h2.039L6.487 3.24H4.3l13.31 17.403Z" />
  </svg>;
}

function TikTokIcon(props) {
  return <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M16.6 2h-3.3v13.3a3.1 3.1 0 1 1-2.7-3.1V8.8a6.5 6.5 0 1 0 6 6.5V8.6a8.1 8.1 0 0 0 4.7 1.5V6.8A4.8 4.8 0 0 1 16.6 2Z" />
  </svg>;
}

const PLATFORMS = [
  { key: "instagram", label: "Instagram", Icon: Instagram },
  { key: "twitter", label: "X", Icon: XIcon },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon },
];

function accountDetails(account) {
  const source = typeof account === "string" ? account : account?.url;
  let href = null;
  let username = typeof account?.username === "string" ? account.username.trim() : "";
  try {
    const url = new URL(source);
    if (["https:", "http:"].includes(url.protocol)) {
      href = url.href;
      if (!username) username = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "");
    }
  } catch {
    // Missing profile data stays visibly inactive rather than linking elsewhere.
  }
  return { href, username: username ? `@${username.replace(/^@+/, "")}` : "@username" };
}

export default function ProfileSocialLinks({ socials, name }) {
  return <div className="profile-socials" aria-label={`${name} social profiles`}>
    {PLATFORMS.map(({ key, label, Icon }) => {
      const { href, username } = accountDetails(socials?.[key]);
      const Tag = href ? "a" : "span";
      return <Tag key={key} className="profile-social" title={href ? username : `${label}: profile link not added yet`}
        aria-label={`${label}: ${username}`}
        {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : { "aria-disabled": true })}>
        <Icon className="profile-social__icon" width={14} height={14} strokeWidth={1.5} aria-hidden="true" />
        <span className="profile-social__username">{username}</span>
      </Tag>;
    })}
  </div>;
}
