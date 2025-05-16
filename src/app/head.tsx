export default function Head() {
  return (
    <>
      <title>Reslo – AI Resume Optimizer</title>
      <meta name="description" content="Optimize your resume in seconds with AI that matches your experience to any job description. Pass ATS scans and land more interviews." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />

      {/* Open Graph / Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Reslo – AI Resume Optimizer" />
      <meta property="og:description" content="Optimize your resume in seconds with AI that matches your experience to any job description. Pass ATS scans and land more interviews." />
      <meta property="og:image" content="/og-image.png" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Reslo – AI Resume Optimizer" />
      <meta name="twitter:description" content="Optimize your resume in seconds with AI that matches your experience to any job description. Pass ATS scans and land more interviews." />
      <meta name="twitter:image" content="/og-image.png" />
      {/* Twitter conversion tracking base code */}
      <script
        dangerouslySetInnerHTML={{
          __html: `!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script'); twq('config','prdxh');`
        }}
      />
      {/* End Twitter conversion tracking base code */}
    </>
  );
}