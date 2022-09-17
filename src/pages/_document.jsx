import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          {/* HTML */}
          <link rel="shortcut icon" href="/img/favicon.ico" />
          <meta name="description" content="Another osu! skins website!" />
          <meta name="author" content="Akinari" />
          <meta name="copyright" content="Akinari" />
          <meta
            name="keywords"
            content="Akinari Portal, Portal, Akinari, osu"
          />
          <meta name="robots" content="index, follow" />
          <meta name="theme-color" content="#232931" />
          <meta charSet="utf-8" />
          {/* DISCORD */}
          <meta property="og:url" content="https://akinariportal.vercel.app/" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Akinari Portal" />
          <meta
            property="og:description"
            content="Another osu! skins website!"
          />
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
          <meta
            name="twitter:description"
            content="Another osu! skins website!"
          />
          <meta
            name="twitter:image"
            content="https://akinariosu.s-ul.eu/7Gcmq9qk"
          ></meta>
          <meta name="twitter:site" content="@Akinari_osu" />
          <meta name="twitter:image:alt" content="Akinari Portal Logo" />
          {/* MANIFEST */}
          <link rel="manifest" href="/manifest.json" />
          {/* APPLE MANIFEST */}
          <meta name="apple-mobile-web-app-capable" content="yes"></meta>
          <link rel="apple-touch-icon" href="/icon-512x512.png"></link>
          <link
            href="splashscreens/iphone5_splash.png"
            media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/iphone6_splash.png"
            media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/iphoneplus_splash.png"
            media="(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/iphonex_splash.png"
            media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/iphonexr_splash.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/iphonexsmax_splash.png"
            media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/ipad_splash.png"
            media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/ipadpro1_splash.png"
            media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/ipadpro3_splash.png"
            media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
          <link
            href="/img/splashscreens/ipadpro2_splash.png"
            media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
            rel="apple-touch-startup-image"
          />
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
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="true"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
            rel="stylesheet"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
