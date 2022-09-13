import { getSession } from "next-auth/react";
import "../styles/styles.css";
import "../styles/settings.css";
import "../styles/scrollbars.css";
import "../styles/tags.css";
import "../styles/Navbar.css";
import "../styles/MobileNavbar.css";
import "../styles/RecentSkins.css";
import "../styles/Users.css";
import "../styles/Socials.css";
/* import "../styles/NotificationsContainer.css"; */
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

function MyApp({ Component, pageProps, session }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Akinari Portal</title>
      </Head>
      <Navbar session={session} />
      <Component {...pageProps} />
    </>
  );
}

MyApp.getInitialProps = async (context) => {
  // Get user session
  const session = await getSession(context.ctx);

  return {
    session,
  };
};

export default MyApp;
