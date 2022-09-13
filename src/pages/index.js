import Head from "next/head";
import RecentSkins from "../components/RecentSkins/RecentSkins";
import RecentUsers from "../components/RecentUsers/RecentUsers";
import supabase from "../config/supabaseClient";

export default function Home({ dbUsers, dbSkins }) {
  return (
    <>
      <Head>
        <title>Akinari Portal</title>
      </Head>
      <div className="homeContent">
        <object
          style={{
            height: 150,
            filter: "brightness(1.1)",
            margin: 40,
          }}
          type="image/webp"
          data="/img/logoFull.webp"
        />
        <RecentSkins rSkins={dbSkins} />
        <RecentUsers rUsers={dbUsers} />
      </div>
    </>
  );
}

export async function getServerSideProps() {
  const users = await supabase
    .from("users")
    .select()
    .order("created_at", { ascending: false })
    .limit(6);

  const skins = await supabase
    .from("skins")
    .select("Banner,URL,Modes,Name,Player(id,username),Downloads")
    .order("created_at", { ascending: false })
    .limit(4);

  return {
    props: {
      dbUsers: users.error ? users.error : users.data,
      dbSkins: skins.error ? skins.error : skins.data,
    },
  };
}
