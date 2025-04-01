export function GET() {
  const resumeUrl = `https://oobsgatmbpvrncgfqqjb.supabase.co/storage/v1/object/public/documents//Mohamad%20Adithya%20-%20CV.pdf`;

  return new Response(null, {
    status: 307,
    headers: {
      Location: resumeUrl,
    },
  });
}
