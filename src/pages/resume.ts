import type { APIRoute } from "astro";

export const GET: APIRoute = ({ redirect }) => {
  const resumeUrl =
    "https://drive.google.com/file/d/1eldd0aLiAb1FUCkwZWZxsT5O6q0mXbnR/view?usp=drive_link";

  // Redirect to the resume URL
  return redirect(resumeUrl);
};
