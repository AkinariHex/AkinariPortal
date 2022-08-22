import { motion } from "framer-motion";
import { ExternalLink } from "react-external-link";
import RecentSkins from "../components/RecentSkins/RecentSkins";
import RecentUsers from "../components/RecentUsers/RecentUsers";

export default function Home({ recentSkins, recentUsers }) {
  return (
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
      <RecentSkins rSkins={recentSkins} />
      <RecentUsers rUsers={recentUsers} />
    </div>
  );
}

export async function getServerSideProps() {
  const recentSkins = await fetch(
    `${process.env.NEXTAUTH_URL}/api/recentskins`
  ).then((res) => res.json());

  const recentUsers = await fetch(
    `${process.env.NEXTAUTH_URL}/api/recentusers`
  ).then((res) => res.json());

  return {
    props: {
      recentSkins,
      recentUsers,
    },
  };
}
