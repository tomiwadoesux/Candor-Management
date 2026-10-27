"use client";

// The footer sign-up. PLACEHOLDER: there is no mailing list behind it yet, so
// submitting does nothing beyond keeping the page where it is. Wire onSubmit
// to the list provider before launch.
export default function NewsletterForm({ label }) {
  return (
    <form
      className="an-news"
      onSubmit={(e) => e.preventDefault()}
      aria-label={label}
    >
      <label htmlFor="an-news-email" className="an-news-label">
        {label}
      </label>
      <div className="an-news-field">
        <input
          id="an-news-email"
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <button type="submit" aria-label="Sign up">
          →
        </button>
      </div>
    </form>
  );
}
