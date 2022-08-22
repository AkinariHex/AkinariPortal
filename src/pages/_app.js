import { getSession } from "next-auth/react";
import "../styles/styles.css";
import "../styles/scrollbars.css";
import "../styles/Navbar.css";
import "../styles/MobileNavbar.css";
import "../styles/RecentSkins.css";
import "../styles/Users.css";
import Navbar from "../components/Navbar/Navbar";
import Head from "next/head";
import Router from "next/router";

import ProgressBar from "@badrap/bar-of-progress";

const progress = new ProgressBar({
  size: 1.5,
  color: "var(--color-active)",
  className: "bar-of-progress",
  delay: 100,
});

Router.events.on("routeChangeStart", progress.start);
Router.events.on("routeChangeComplete", progress.finish);
Router.events.on("routeChangeError", progress.finish);

function MyApp({ Component, pageProps, session, userStatus }) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/ico" href="favicon.ico" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* HTML */}
        <title>Akinari Portal</title>
        <meta name="description" content="Just a cool skins portal!" />
        <meta name="author" content="Akinari" />
        <meta name="copyright" content="Akinari" />
        <meta name="keywords" content="Akinari Portal, Portal, Akinari, osu" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#232931ff" />
        {/* DISCORD */}
        <meta property="og:url" content="https://akinariportal.vercel.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Akinari Portal" />
        <meta property="og:description" content="Just a cool skins portal!" />
        <meta
          property="og:image"
          content="https://akinariosu.s-ul.eu/7Gcmq9qk"
        />
        {/* TWITTER */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="akinariportal.vercel.app" />
        <meta
          property="twitter:url"
          content="https://akinariportal.vercel.app/"
        />
        <meta name="twitter:title" content="Akinari Portal" />
        <meta name="twitter:description" content="Just a cool skins portal!" />
        <meta
          name="twitter:image"
          content="https://akinariosu.s-ul.eu/7Gcmq9qk"
        ></meta>
        <meta name="twitter:site" content="@Akinari_osu" />
        <meta name="twitter:image:alt" content="Akinari Portal Logo" />
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RXYZ8EPLR2"
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: ` window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-RXYZ8EPLR2');`,
          }}
        ></script>

        <link
          href="https://unpkg.com/boxicons@2.0.9/css/boxicons.min.css"
          rel="stylesheet"
        ></link>
      </Head>
      <Navbar session={session} userStatus={userStatus} />
      <Component {...pageProps} />
    </>
  );
}

MyApp.getInitialProps = async (context) => {
  // Get user session
  const session = await getSession(context.ctx);

  const statusData =
    session !== null
      ? await fetch(`${process.env.NEXTAUTH_URL}/api/users?u=${session.id}`)
          .then((res) => res.json())
          .then((res) => res[0])
      : [{}];

  return {
    session: session,
    userStatus: statusData,
  };
};

export default MyApp;
